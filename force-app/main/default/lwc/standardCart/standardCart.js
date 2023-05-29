

import { api, LightningElement, track, wire } from "lwc";

import { auraExceptionHandler } from "c/auraExceptionHandler";

import fetchCurrentCartItems from "@salesforce/apex/StandardCartController.fetchCurrentCartItemsFromCart";
import fetchProductImages from "@salesforce/apex/ProductController.fetchProductImages";
import deleteCartItem from "@salesforce/apex/StandardCartController.deleteCartItem";
import updateCartItem from "@salesforce/apex/StandardCartController.updateCartItem";
import { NavigationMixin } from "lightning/navigation";
import { groupBy, groupBy2Keys, groupBySingle } from "c/utils";

import { publish, MessageContext } from "lightning/messageService";
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";
import {ContextProvider} from "c/communityContextProvider";

class CartValidation {
	validateAndCorrectQtyIfFail(event, input) {
		let isValid = this.validateQuantity(event.target.value);
		input.value = isValid ? event.target.value : 1;
	}

	validateQuantity(val) {
		return 0 < val;
	}
}

let validation = new CartValidation();

export default class StandardCart extends NavigationMixin(ContextProvider(LightningElement)) {
	@api currencyIsoCode;
	@api cartId;

	@track cartItems;

	isLoading = false;
	loaded = false;

	@wire(MessageContext)
	messageContext;

	async connectedCallback() {
		await this.fetch();
	}

	async fetch() {
		this.isLoading = true;

		try {
			const cartItems = await fetchCurrentCartItems({
				cartId: this.cartId
			});
			const productIds = cartItems.map(item => item.Product2Id);
			const images = await fetchProductImages({ productIds });

			this.cartItems = cartItems.map(item => ({
				...item,
				image: images[item.Product2Id],
			}));
		} catch (error) {
			auraExceptionHandler.logAuraException(error);
		} finally {
			this.isLoading = false;
			this.loaded = true;
		}
	}

	get itemGroups() {
		const byConfigurationID = groupBy2Keys(this.cartItems || [], "Configuration_ID__c", "VIN_Number__c");

		const isConversion = item => item.Product2.acCore__PartClass__c === "FGCV";
		const isChassis = item => item.Product2.acCore__PartClass__c === "CHAS";

		const isTurny = items => items.every(item => item.Product2.acCore__PartClass__c === "FGGS");
		const isVehicle = items => items.some(isConversion);

		console.log(JSON.parse(JSON.stringify(byConfigurationID)));

		const groups = Object.keys(byConfigurationID).reduce((all, key) => {
			const items = byConfigurationID[key];
			const configurationID = key.split('__').shift();
			const hasConfigurationID = !!configurationID && configurationID !== 'undefined';

			if (!hasConfigurationID) {
				return [
					...all,
					...items.map(item => ({
						...item,
						uniqueId: item.Id,
						name: item.Product2.Name,
						description: item.Product2.Description,
						sku: item.Product2.ProductCode,
						smartString: item.Configuration_Smart_String__c,
						isConfiguration: false,
					})),
				];
			} else if (isTurny(items)) {
				return [
					...all,
					...items.map(item => ({
						...item,
						uniqueId: item.Id,
						name: item.Product2.Name,
						description: item.Product2.Description,
						smartString: item.Configuration_Smart_String__c,
						sku: item.Product2.ProductCode,
						isConfiguration: true,
						isTurny: true,
					})),
				];
			} else if (isVehicle(items)) {
				const chassis = items.find(isChassis);
				const conversion = items.find(isConversion);
				return [
					...all,
					{
						uniqueId: chassis.Id,
						image: chassis.image,
						name: chassis.Product2.Name,
						description: chassis.Product2.Description,
						smartString: chassis.Configuration_Smart_String__c,
						sku: chassis.Product2.ProductCode,
						isConfiguration: true,
						isWav: true,
						TotalPrice: chassis.UnitAdjustedPrice + conversion.UnitAdjustedPrice,
						chassis,
						conversion,
					},
				];
			}

			return [...all];
		}, []);

		console.log(JSON.parse(JSON.stringify(groups)));

		return groups;
	}

	async deleteCartItem(event) {
		this.isLoading = true;

		const { uniqueId } = event.target.dataset;
		const cartItem = this.itemGroups.find(item => item.uniqueId === uniqueId)

		try {
			const toRemove = cartItem.isWav
				? [cartItem.chassis.Id, cartItem.conversion.Id]
				: [cartItem.Id];

			await deleteCartItem({
				ctx: this.communityContext,
				cartId: this.cartId,
				cartItemIds: toRemove
			});
			await this.fetch();
			publish(this.messageContext, cartChanged);
		} catch (error) {
			auraExceptionHandler.logAuraException(error);
		} finally {
			this.isLoading = false;
		}
	}

	async updateCartItem(event) {
		this.isLoading = true;
		try {
			this.validateQtyBeforeUpdate(event);

			const params = {
				ctx: this.communityContext,
				cartId: this.cartId,
				cartItemId: event.target.dataset.cartItemId,
				productId: event.target.dataset.productId,
				quantity: event.target.value,
				type: "Product",
			};

			await updateCartItem(params);
			await this.fetch();
			publish(this.messageContext, cartChanged);
		} catch (error) {
			auraExceptionHandler.logAuraException(error);
		} finally {
			this.isLoading = false;
		}
	}

	validateQtyBeforeUpdate(event) {
		let inputId = event.target.dataset.productId;
		let qtyInput = this.template.querySelector(`[data-product-id="${inputId}"]`);
		validation.validateAndCorrectQtyIfFail(event, qtyInput);
	}

	goToPDP(event) {
		const { uniqueId } = event.currentTarget.dataset;
		console.log(uniqueId);

		const item = this.itemGroups.find(item => item.uniqueId === uniqueId);
		console.log(JSON.parse(JSON.stringify(item)));
		console.log(item.chassis.Configuration_Inventory__r.PortalInventory__c);

		debugger;
		if (!item.isConfiguration) {
			this[NavigationMixin.Navigate]({
				type: "standard__recordPage",
				attributes: {
					recordId: uniqueId,
					objectApiName: "Product2",
					actionName: "view",
				},
			});
		} else if (item.isTurny) {
			this[NavigationMixin.Navigate]({
				type: "comm__namedPage",
				attributes: {
					name: "Configure_Turney__c",
				},
			});
		} else if (item.isWav) {
			this[NavigationMixin.Navigate]({
				type: "standard__recordPage",
				attributes: {
					recordId: item.chassis.Product2Id,
					objectApiName: "Product2",
					actionName: "view",
				},
				state: {
					inventoryId: item.chassis.Configuration_Inventory__r.PortalInventory__c,
				},
			});
		}
	}
}
