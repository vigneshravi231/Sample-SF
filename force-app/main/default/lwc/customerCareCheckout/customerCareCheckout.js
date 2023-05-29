

import { api, LightningElement, track, wire } from "lwc";
import { createStore, combineReducers, Redux } from "c/lwcRedux";
import { deepClone, logProxy } from "c/utils";
import reducers, { checkout } from "c/reduxStore";

import {fireEvent} from "c/pubsub";
import { EVENT_ACCORDION_COLLAPSE, EVENT_ACCORDION_EXPAND } from "c/checkoutUtils";

import { NavigationMixin } from "lightning/navigation";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import { publish, MessageContext } from "lightning/messageService";
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";

// apex methods
import fetchProductImages from "@salesforce/apex/ProductController.fetchProductImages";
import fetchPaymentInfo from "@salesforce/apex/PaymentOptionsController.tryGetInitContext";

import splitCart from "@salesforce/apex/CartCheckoutController.splitCart";
import simulateSplit from "@salesforce/apex/CartCheckoutController.simulateSplit";
import getMiscCharges from "@salesforce/apex/CartCheckoutController.getMiscCharges";
import placeOrder from "@salesforce/apex/CartCheckoutController.placeOrder";
import requestQuote from "@salesforce/apex/CartCheckoutController.requestQuote";
import updateCart from "@salesforce/apex/CartCheckoutController.updateCart";
import getOrderTypeMapping from "@salesforce/apex/CartCheckoutController.getOrderTypeMapping";
import fetchCheckoutPermissions from "@salesforce/apex/CartCheckoutController.getCheckoutPermissions";
import fetchCartItems from "@salesforce/apex/StandardCartController.fetchCurrentCartItemsFromCart";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import {ContextProvider} from "c/communityContextProvider";

const SCREEN_GENERAL_INFO = "screen_general_info";
const SCREEN_SHIPPING = "screen_shipping";
const SCREEN_MISC_CHARGES = "screen_misc_charges";

export default class CustomerCareCheckout extends NavigationMixin(ContextProvider(Redux(LightningElement))) {
	@api cart;
	@api recordId;
	@api addresses;
	@api contact;
	@api buyerAccount;
	@api paymentTerms;

	@api orderDeliveryMethods;
	@api store;

	@track state;
	@track splits;
	@track loaded = false;
	@track showMiscCharges = false;
	@track isLineLevelShipping = false;
	@track isLoading = false;
	@track currentScreen = SCREEN_GENERAL_INFO;
	@track simulateSplit = [];

	@wire(MessageContext)
	messageContext;

	async connectedCallback() {
		super.connectedCallback();
	}

	get isGeneralInfoScreen() {
		return this.currentScreen === SCREEN_GENERAL_INFO;
	}

	get isShippingScreen() {
		return this.currentScreen === SCREEN_SHIPPING;
	}

	get isMiscChargesScreen() {
		return this.currentScreen === SCREEN_MISC_CHARGES;
	}

	get showSpinner() {
		return !this.loaded || this.isLoading;
	}

	get addressCheckoutHeader() {
		return this.isLineLevelShipping ? "Review your Billing Address" : "Review your Billing and Shipping Address";
	}

	get orderReviewHeader() {
		return this.isLineLevelShipping ? "Review your Order and Shipping" : "Review your Order";
	}

	get lineLevelShippingLabel() {
		return this.isLineLevelShipping ? "Disable Line Level Shipping" : "Enable Line Level Shipping";
	}

	get canPlaceOrder(){
		return this.state.checkoutPermissions.canPlaceOrder;
	}

	get userCanRequestQuote() {
		return this.state.checkoutPermissions.canRequestQuote;
	}

	get canRequestQuote(){
		return this.userCanRequestQuote && !this.hasPartsOrder;
	}

	get hasPartsOrder(){
		return (this.splits || []).some(split => split.orderSplit.Type === 'Parts');
	}

	get placeOrderLabel(){
		return this.canPlaceOrder ? "Place Order" : "Send for Approval"
	}

	get canUseLineLevelShipping() {
		return this.state?.cartItems.length > 1 || this.state?.cartItems.reduce((totalQuantity, cartItem) => totalQuantity + cartItem.Quantity, 0) > 1;
	}

	showAddAddressModal() {
		this.template.querySelector("c-co-addresses").showAddressModal();
	}

	gotoCart() {
		this[NavigationMixin.Navigate]({
			type: "standard__recordPage",
			attributes: {
				recordId: this.cart.Id,
				objectApiName: "WebCart",
				actionName: "view",
			},
		});
	}

	handleLineLevelShippingClick() {
		this.store.dispatch({
			type: checkout.actions.LINE_LEVEL_SHIPPING_CHANGED,
		});

		this.isLineLevelShipping = this.state.selection.isLineLevelShipping;
	}

	async handleOrderConfirmed() {
		this.isLoading = true;

		try {
			const selection = this.getCheckoutSelection();

			await updateCart({ selection });

			this.simulateSplit = (
				await simulateSplit({
					cartId: this.state.cart.Id,
					shippingLines: selection.shippingLines,
				})
			).map(split => ({
				...split,
				splitKey: `${split.key.addressId}__${split.key.orderType}__${split.key.vinNumber || ''}`,
			}));

			this.store.dispatch({
				type: checkout.actions.SIMULATE_SPLIT,
				payload: this.simulateSplit,
			});

			this.currentScreen = SCREEN_SHIPPING;
			this.scrollTop();
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
			const toast = new ShowToastEvent({
				title: "Processing error",
				variant: "error",
				message: "Unable to process your cart. Please try again later"
			})
			this.dispatchEvent(toast);
		} finally {
			this.isLoading = false;
		}
	}

	get isPostSimulateSplit() {
		return !this.isGeneralInfoScreen && (this.simulateSplit || []).length > 0;
	}

	getCheckoutSelection() {
		const state = this.state;
		const isLineLevelShipping = state.selection.isLineLevelShipping;
		const shippingLines = this.isPostSimulateSplit
			? this.createShippingLinesPostSplitSimulate(state)
			: this.createShippingLinesPreSplitSimulate(state);

		return {
			cartId: state.cart.Id,
			paymentOption: state.selection.paymentOption,
			shippingAddressId: isLineLevelShipping ? null : state.selection.shipTo.Id,
			billingAddressId: state.selection.billTo.Id,
			deliveryInstructions: state.selection.deliveryInstructions,
			poNumber: state.selection.poNumber,
			isLineLevelShipping,
			shippingLines,
		};
	}

	scrollTop() {
		const topDiv = this.template.querySelector(".top-most-div");
		topDiv.scrollIntoView({
			behavior: "smooth",
			block: "center",
			inline: "nearest",
		});
	}

	handleMiscChargesBackClick() {
		this.currentScreen = SCREEN_SHIPPING;
		this.scrollTop();
	}

	handleGotoShippingScreen() {
		this.currentScreen = SCREEN_SHIPPING;
		this.scrollTop();
	}

	handleShippingScreenBackClick() {
		this.currentScreen = SCREEN_GENERAL_INFO;
		this.scrollTop();
	}

	async handleShippingSelection() {
		const state = this.state;

		this.isLoading = true;

		try {
			const selection = this.getCheckoutSelection();

			this.splits = await splitCart({
				cartId: state.cart.Id,
				selection,
			});

			this.splits = await getMiscCharges({ cartId: state.cart.Id });

			this.currentScreen = SCREEN_MISC_CHARGES;
		} catch (err) {
			this.displayErrorToast();
			auraExceptionHandler.logAuraException(err);
		} finally {
			this.isLoading = false;
		}
	}

	async handleRequestQuote() {
		this.isLoading = true;

		try {
			await requestQuote({ cartId: this.state.cart.Id });
			await this.handleOrderPlace();

		} catch (err) {
			this.displayErrorToast();
			auraExceptionHandler.logAuraException(err);
		} finally {
			this.isLoading = false;
		}
	}

	async handleOrderPlace() {
		this.isLoading = true;

		try {
			await placeOrder({ cartId: this.state.cart.Id });
			publish(this.messageContext, cartChanged);

			this[NavigationMixin.Navigate]({
				type: "comm__namedPage",
				attributes: {
					name: "Order_Summary__c",
				},
				state: {
					cartId: this.state.cart.Id,
				},
			});

		} catch (err) {
			this.displayErrorToast();
			auraExceptionHandler.logAuraException(err);
		} finally {
			this.isLoading = false;
		}
	}

	createShippingLinesPreSplitSimulate(state) {
		const isLineLevelShipping = state.selection.isLineLevelShipping;
		const findAddress = addressId => state.addresses.find(a => a.Id === addressId);

		return state.cartItems.reduce((all, item) => {
			const addressId = isLineLevelShipping ? item.ShippingAddress?.Id : state.selection.shipTo.Id;

			const main = {
				cartItemId: item.Id,
				quantity: item.Quantity,
				addressId,
				oneTimeShippingAddress: findAddress(addressId).One_Time_Shipping__c,
			};

			const splits = item.splitItems.map(splitItem => {
				return {
					cartItemId: item.Id,
					quantity: splitItem.Quantity,
					addressId: splitItem.ShippingAddress.Id,
					oneTimeShippingAddress: findAddress(splitItem.ShippingAddress.Id).One_Time_Shipping__c,
				};
			});
			return [...all, ...splits, main];
		}, []);
	}

	createShippingLinesPostSplitSimulate(state) {
		const findSplitSelection = split => state.selection.bySplit[split.splitKey] || {};
		const findAddress = split => state.addresses.find(a => a.Id === split.key.addressId);

		return state.simulateSplit.reduce((all, split) => {
		  	const address = findAddress(split);
		  	const splitSelection = findSplitSelection(split);

		  	console.log('split selection')
			console.log(JSON.parse(JSON.stringify(splitSelection)));

			const lines = split.shippingLines.map(line => ({
				...line,
				deliveryMethodId: splitSelection.deliveryMethodId,
				preferredShippingAccountNumber: splitSelection.shippingAccountNumber,
				shipOrderComplete: splitSelection.shipOrderComplete,
				oneTimeShippingAddress: address.One_Time_Shipping__c
			}));
			return [...all, ...lines];
		}, []);
	}

	updateState() {
		this.state = this.store.getState().checkout;
	}

	async initialize() {
		const combineReducersInstance = combineReducers(reducers);
		this.store = createStore(combineReducersInstance, this.createLogger());

		const [
			{ cartItems: extendedCartItems, partsOnly, orderTypeMapping},
			{ isCreditCardOnFileAvailable, paymentTypes },
			checkoutPermissions
		] = await Promise.all([
			this.extendCartItems(),
			fetchPaymentInfo({ ctx: this.communityContext }),
			fetchCheckoutPermissions(),
		]);

		const newStore = {
			recordId: this.recordId,
			cart: deepClone(this.cart),
			cartItems: extendedCartItems,
			addresses: deepClone((this.addresses || [])),
			contact: deepClone(this.contact),
			netTerms: deepClone((this.paymentTerms || {})),
			orderDeliveryMethods: deepClone((this.orderDeliveryMethods || [])),
			isCreditCardOnFileAvailable,
			paymentTypes,
			partClassToOrderTypeMapping: orderTypeMapping,
			partsOnly: partsOnly,
			buyerAccount: this.buyerAccount,
			checkoutPermissions,
		};

		this.store.subscribe(this.updateState.bind(this));

		this.store.dispatch({
			type: checkout.actions.INITIALIZE_STORE,
			payload: newStore,
		});

		this.loaded = true;
	}

	async extendCartItems() {
	  	const items = await fetchCartItems({
			cartId: this.recordId,
		});
		const productIds = items.map(item => item.Product2Id);
		const images = await fetchProductImages({ productIds });

		const partClasses = items.map(item => item.Parts_Class__c);
		const orderTypeMapping = await getOrderTypeMapping({ partClasses });
		const isParts = item => orderTypeMapping[item.Parts_Class__c] === 'Parts'
		const partsOnly = items.every(isParts);

		const extendedItems = items.map(item => ({
			...item,
			imageUrl: images[item.Product2Id],
			splitItems: [],
			baseQuantity: item.Quantity,
			baseTotal: item.TotalPrice,
			ShippingAddress: {},
		}));

		return {
			cartItems: extendedItems,
			partsOnly,
			orderTypeMapping,
		};
	}

	createLogger() {
		console.log("creating logger");
		return store => next => action => {
			const deproxy = o => {
				try {
					return JSON.parse(JSON.stringify(o));
				} catch (e) {
					return o;
				}
			};

			try {
				console.group(action.type);
				const oldState = store.getState().checkout;

				console.log("current state", deproxy(oldState));
				console.info(`dispatching`, deproxy(action));

				let result = next(action);
				const newState = store.getState().checkout;

				console.log("next state", deproxy(newState));
				console.groupEnd();

				return result;
			} catch (err) {
				console.log(err);
				return err;
			}
		};
	}

	expandAll() {
		fireEvent(EVENT_ACCORDION_EXPAND);
	}

	collapseAll() {
		fireEvent(EVENT_ACCORDION_COLLAPSE);
	}

	displayErrorToast(message){
		this.dispatchEvent(new ShowToastEvent({
			title: 'Something went wrong...',
			message: message || 'Please try again later',
			variant: 'error',
          	mode: 'dismissable',
		}))
	}
}
