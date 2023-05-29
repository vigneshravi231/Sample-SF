

import { api, LightningElement, track } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import fetchOrderSummary from "@salesforce/apex/OrderSummaryController.fetchOrderSummary";

import approveRequisitionOrder from "@salesforce/apex/OrderSummaryController.approveAndUpdatePoNumber";
import rejectRequisitionOrder from "@salesforce/apex/OrderSummaryController.rejectOrder";

import canApproveRequisitionOrder from "@salesforce/apex/PersonaManagerController.canApproveRequisitionOrder";

import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class SingleOrderSummary extends LightningElement {
	@api recordId;

	@track isLoading = false;

	@track totals = {
		miscTotal: 0,
	};

	requisitionPoNumber;
	canApproveRequisitionOrder = false;

	_order;

	async connectedCallback() {
		await this.fetch();
	}

	async fetch() {
		this.isLoading = true;
		try {
			this._order = await fetchOrderSummary({ orderSummaryID: this.recordId });
			console.log(JSON.parse(JSON.stringify(this._order)));
			this.canApproveRequisitionOrder = await canApproveRequisitionOrder();
			this.requisitionPoNumber = this.originalOrder.PoNumber.startsWith("REQUISITION-ORDER-") ? "" : this.originalOrder.PoNumber;
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
		} finally {
			this.isLoading = false;
		}
	}

	get hasData() {
		return !!this._order;
	}

	get orderHeader() {
		const paymentOption = () => {
			return this.order.PaymentOption__c === "netTerms" ? "Net Terms" : "Credit Card On File";
		};

		return {
			billTo: this.order.BillingAddress,
			paymentOption: paymentOption(),
			poNumber: this.order.PoNumber,
			deliveryInstructions: this.order.Delivery_Instructions__c,
		};
	}

	get order() {
		const miscCharges = this._order.OrderItemSummaries.filter(item => item.Type === "Delivery Charge");

		// todo: temp fix - order items created in epicor are missing Type
		// todo: so for now we ignore the product/charge grouping and display all as product
		const items = this._order.OrderItemSummaries.filter(item => item.Type === "Order Product" || this._order.OriginalOrder.Created_in_Epicor__c);

		const totalMiscChargesAmount = miscCharges.reduce((total, charge) => total + charge.TotalLineAmount, 0);

		const vin = this._order.OrderItemSummaries.map(i => i.VIN_Number__c)
			.filter(Boolean)
			.shift();

		const showVin = this._order.OriginalOrder?.Type === "Vehicle" && !!vin;

		return {
			...this._order,
			deliveryGroup: this._order.OrderDeliveryGroupSummaries[0] || {},
			items,
			status: this._order?.OriginalOrder?.Status,
			miscCharges,
			totalMiscChargesAmount,
			showVin,
			vin,
		};
	}

	get orderTitle() {
		return this.isRequisitionOrder ? "Requisition Order Confirmation" : "Order Confirmation";
	}

	get originalOrder() {
		return this.order?.OriginalOrder;
	}

	get isRequisitionOrder() {
		return this.order?.OriginalOrder.Is_Requisition_Order__c;
	}

	get hasQuoteNumber() {
		return !!this.order?.OriginalOrder?.Quote_Number__c;
	}

	get hasQuoteEXPDate() {
		return !!this.originalOrder?.QuoteEXPDate__c;
	}

	get isApproved() {
		return this.originalOrder?.Approval_Status__c === "Approved";
	}

	get isRejected() {
		return this.originalOrder?.Approval_Status__c === "Rejected";
	}

	get isPendingRequisitionOrder() {
		return this.isRequisitionOrder && this.originalOrder?.Approval_Status__c === "Pending";
	}

	get displayRequisitionOrderActions() {
		return this.isPendingRequisitionOrder && this.canApproveRequisitionOrder;
	}

	get noRequisitionPoNumber() {
		return !this.requisitionPoNumber;
	}

	get approver() {
		const approverUser = this.originalOrder?.Approver__r;

		return [
			approverUser?.FirstName ?? "", // first name is optional
			approverUser?.LastName,
		].join(" ");
	}

	get hasTrackingNumber() {
		return !!this.originalOrder?.Tracking_Number__c
	}

	get trackingNumber() {
		return this.originalOrder?.Tracking_Number__c;
	}

	async approveRequisitionOrder() {
		this.isLoading = true;

		try {
			await approveRequisitionOrder({
				summaryID: this.order.Id,
				poNumber: this.requisitionPoNumber,
			});
			await this.fetch();
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
			this.dispatchEvent(
				new ShowToastEvent({
					title: "Error",
					message: "There was an error approving your order, please contact your administrator",
					variant: "error",
					mode: "dismissable",
				})
			);
		} finally {
			this.isLoading = false;
		}
	}

	async rejectRequisitionOrder() {
		this.isLoading = true;

		try {
			await rejectRequisitionOrder({
				orderId: this.originalOrder.Id,
			});
			await this.fetch();
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
			this.dispatchEvent(
				new ShowToastEvent({
					title: "Error",
					message: "There was an error rejecting your order, please contact your administrator",
					variant: "error",
					mode: "dismissable",
				})
			);
		} finally {
			this.isLoading = false;
		}
	}

	poNumberChanged(event) {
		this.requisitionPoNumber = event.target.value;
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
