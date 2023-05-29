
import { LightningElement, api, track } from "lwc";
import { groupBySingle } from "c/utils";
import {
	addressUtils,
	validate as validateCheckout,
	shippingScreenValidation,
	EVENT_ACCORDION_COLLAPSE,
	EVENT_ACCORDION_EXPAND
} from "c/checkoutUtils";

import {registerListener} from "c/pubsub";

import { Redux } from "c/lwcRedux";
import { checkout } from "c/reduxStore";

export default class CoShippingOptions extends Redux(LightningElement) {
	@api splits;

	@track deliveryOptions;

	mapStateToProps(state) {
		return {
			deliveryMethods: state.checkout.orderDeliveryMethods,
			isLineLevelShipping: state.checkout.selection.isLineLevelShipping,
			cartItems: state.checkout.cartItems,
			addresses: state.checkout.addresses,
			selectedShipTo: state.checkout.selection.shipTo,
			splitsSelection: state.checkout.selection.bySplit,
			state: state.checkout,
		};
	}

	mapDispatchToProps() {
		return {
			updateSplitSelection: checkout.actions.updateSplitSelection,
		};
	}

	connectedCallback() {
		super.connectedCallback();

		this.deliveryOptions = this.props.deliveryMethods.map(method => ({
			value: method.Id,
			label: method.Name,
		}));

		registerListener(EVENT_ACCORDION_COLLAPSE, this.collapseAccordions.bind(this));
		registerListener(EVENT_ACCORDION_EXPAND, this.expandAccordions.bind(this));
	}

	get hasDeliveryMethods() {
		return this.props.deliveryMethods.length > 0;
	}

	get hasShippingAddresses() {
		return this.shippingOptions.length > 0;
	}

	get shippingOptions() {
		const addressesById = groupBySingle(this.props.addresses, "Id");
		const cartItemsById = groupBySingle(this.props.cartItems, "Id");

		return this.splits.reduce((acc, split) => {
			const { addressId, orderType } = split.key;
			const address = addressesById[addressId];

			return [
				...acc,
				{
					AddressId: addressId,
					OrderType: orderType,
					SplitKey: split.splitKey,
					Label: addressUtils.makeLabel(address),
					NumberOfItems: split.shippingLines.length,
					Items: split.shippingLines.map(splitLine => {
						const item = cartItemsById[splitLine.cartItemId];

						return {
							...item,
							TotalPrice: item.SalesPrice * splitLine.quantity,
							Quantity: splitLine.quantity,
						};
					}),
				},
			];
		}, []);
	}

	get hasErrors() {
		return this.errors.length > 0;
	}

	get errors() {
		return validateCheckout(this.props.state, shippingScreenValidation);
	}

	handleShippingAccountNumberChange(event){
	  	const {splitKey, accountNumber} = event.detail;
	  	const extend = { shippingAccountNumber: accountNumber }

		this.props.updateSplitSelection({splitKey, extend});
	}

	handleShipOrderCompleteChange(event){
		const {splitKey, shipOrderComplete}	= event.detail;
		const extend = { shipOrderComplete }

		this.props.updateSplitSelection({splitKey, extend});
	}

	handleDeliveryOptionSelect(event) {
		const { methodId, splitKey } = event.detail;
		const extend = { deliveryMethodId: methodId }

		this.props.updateSplitSelection({ splitKey, extend });
	}

	confirmShippingSelection() {
		this.dispatchEvent(new CustomEvent("complete"));
	}

	collapseAccordions() {
		this.template.querySelectorAll("c-order-summary-accordion").forEach(accordion => {
			accordion.close();
		});
	}

	expandAccordions() {
		this.template.querySelectorAll("c-order-summary-accordion").forEach(accordion => {
			accordion.open();
		});
	}
}
