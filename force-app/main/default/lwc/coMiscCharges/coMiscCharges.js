

import { LightningElement, api } from "lwc";
import { addressUtils } from "c/checkoutUtils";
import { deepClone } from "c/utils";
import { Redux } from "c/lwcRedux";
import {registerListener} from "c/pubsub";
import {
	EVENT_ACCORDION_COLLAPSE,
	EVENT_ACCORDION_EXPAND
} from "c/checkoutUtils";

export default class CoMiscCharges extends Redux(LightningElement) {
	@api splits = [];

	connectedCallback() {
		super.connectedCallback();

		registerListener(EVENT_ACCORDION_COLLAPSE, this.collapseAccordions.bind(this));
		registerListener(EVENT_ACCORDION_EXPAND, this.expandAccordions.bind(this));
	}

	mapStateToProps(state) {
		return {
			cartItems: state.checkout.cartItems,
			addresses: state.checkout.addresses,
		};
	}

	get cartSplits() {
		const findImageUrl = productId => this.props.cartItems.find(item => item.Product2Id === productId)?.imageUrl;

		return deepClone(this.splits).map(split => {
			const shippingAddress = this.props.addresses.find(a => a.Id === split.deliveryGroup.Shipping_Address__c);

			const miscCharges = (split.splitItems || [])
				.filter(item => item.Type === "Delivery Charge")
				.map(item => ({
					id: item.Id,
					description: item.description,
					code: item.Misc_Charge_Code__c,
					amount: item.TotalLineAmount,
				}));

			const items = (split.splitItems || [])
				.filter(item => item.Type === "Order Product")
				.map(item => {
					return {
						...item,
						imageUrl: findImageUrl(item.Product2Id),
					};
				});

			const totalMiscChargesAmount = miscCharges.reduce((total, charge) => total + charge.amount, 0);

			const created = {
				Id: split.orderSplit.Id,
				formattedAddress: addressUtils.makeLabel(shippingAddress),
				deliveryOption: split.deliveryGroup.OrderDeliveryMethod.Name,
				orderType: split.orderSplit.Type,
				items,
				numberOfItems: items.length,
				miscCharges,
				totalMiscChargesAmount,
			};

			console.log(JSON.parse(JSON.stringify(created)));
			return created;
		});
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
