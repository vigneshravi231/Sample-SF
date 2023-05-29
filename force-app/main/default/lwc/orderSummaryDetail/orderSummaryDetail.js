

import { api, LightningElement, wire, track } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { CurrentPageReference } from "lightning/navigation";

import fetchOrderSummaries from "@salesforce/apex/OrderSummaryController.fetchOrderSummaries";

export default class OrderSummaryDetail extends LightningElement {
	@api recordId;

	@track isLoading = false;

	siteParams;
	_orders;
	_orderHeader;

	totals = {
		subtotal: 0,
		miscTotal: 0
	}

	async connectedCallback() {
		this.isLoading = true;
		try {
			this._orders = await fetchOrderSummaries({ cartId: this.siteParams.cartId });
			this._orderHeader = this.order[0];
			this._orders.forEach(order => {
				this.totals.subtotal += order.TotalAdjustedProductAmount;
				this.totals.miscTotal += order.OrderItemSummaries
					.filter(item => item.Type === 'Delivery Charge')
					.reduce((total, charge) => total + charge.TotalLineAmount, 0);
			});
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
		} finally {
			this.isLoading = false;
		}
	}

	get hasData(){
		return !!this._orders;
	}

	get orderHeader() {

	    const paymentOption = () => {
	        return this._orderHeader.PaymentOption__c === 'netTerms'
                ? "Net Terms" : "Credit Card On File" ;
        }

	    return {
	        billTo: this._orderHeader.BillingAddress,
	        paymentOption: paymentOption(),
            poNumber: this._orderHeader.PoNumber,
            deliveryInstructions: this._orderHeader.Delivery_Instructions__c
        }
    }

	get order(){
		return (this._orders || []).map(order => {

			const miscCharges = order.OrderItemSummaries
					.filter(item => item.Type === 'Delivery Charge');

			const items = order.OrderItemSummaries
				.filter(item => item.Type === 'Order Product');

			const totalMiscChargesAmount = miscCharges.reduce((total, charge) => total + charge.TotalLineAmount, 0);

			console.log({
				...order,
				deliveryGroup: order.OrderDeliveryGroupSummaries[0] || {},
				items,
				miscCharges,
				totalMiscChargesAmount,
			}, 'test');

			return  {
				...order,
				deliveryGroup: order.OrderDeliveryGroupSummaries[0] || {},
				items,
				miscCharges,
				totalMiscChargesAmount,
			}
		})
	}

	get grandTotal() {
		return this.totals.miscTotal + this.totals.subtotal;
	}

	@wire(CurrentPageReference)
	getStateParameters(currentPageReference) {
		if (currentPageReference) {
			this.siteParams = currentPageReference.state;
		}
	}

    expandAll() {
		this.template.querySelectorAll("c-order-summary-accordion").forEach(accordion => {
			accordion.open();
		});
    }

    collapseAll() {
		this.template.querySelectorAll("c-order-summary-accordion").forEach(accordion => {
			accordion.close();
		});
    }

}
