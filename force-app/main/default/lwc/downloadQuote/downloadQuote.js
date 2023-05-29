
import { LightningElement, api, track } from "lwc";
import fetchOrderSummary from "@salesforce/apex/OrderSummaryController.fetchOrderSummary";
import downloadQuote from "@salesforce/apex/OrderSummaryController.downloadQuote";
import approveOrder from "@salesforce/apex/OrderSummaryController.approveAndUpdatePoNumber";
import rejectOrder from "@salesforce/apex/OrderSummaryController.rejectOrder";
import canApproveQuote from "@salesforce/apex/PersonaManagerController.canApproveQuote";

import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class DownloadQuote extends LightningElement {
	@api recordId;
	@track summary;

	canApproveQuote = false;
	isLoading = false;
	quotePoNumber;

	async connectedCallback() {
		await this.fetch();
		this.canApproveQuote = await canApproveQuote();
	}

	get convertQuoteDisabled(){
		return !this.quotePoNumber;
	}

	get order() {
		return this.summary?.OriginalOrder;
	}

	get canDownloadQuote() {
		return !!this.order?.Quote_Number__c;
	}

	get canConvertQuote() {
		return this.canApproveQuote && this.order?.Can_Convert_Quote__c;
	}

	async fetch() {
		try {
			this.summary = await fetchOrderSummary({
				orderSummaryID: this.recordId,
			});
			this.quotePoNumber = this.order.PoNumber;
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
		}
	}

	async convertQuote() {
		this.isLoading = true;

		try {
			await approveOrder({
				summaryID: this.summary.Id,
				poNumber: this.quotePoNumber
			});
			await this.fetch();
			this.dispatchEvent(new CustomEvent("converted"));
		} catch (err) {
			auraExceptionHandler.logAuraException(err);

			this.dispatchEvent(
				new ShowToastEvent({
					variant: "error",
					title: "Ups, something went wrong",
					message: "There was an error converting your quote to order, please contact the administrator",
				})
			);
		} finally {
			this.isLoading = false;
		}
	}

	async rejectQuote() {
		this.isLoading = true;

		try {
			await rejectOrder({
				orderId: this.order.Id,
			});
			await this.fetch();
			this.dispatchEvent(new CustomEvent("rejected"));
		} catch (err) {
			auraExceptionHandler.logAuraException(err);

			this.dispatchEvent(
				new ShowToastEvent({
					variant: "error",
					title: "Ups, something went wrong",
					message: "There was an error rejecting your quote, please contact the administrator",
				})
			);
		} finally {
			this.isLoading = false;
		}
	}

	async downloadQuote() {
		this.isLoading = true;

		try {
			const pdfBase64 = await downloadQuote({
				quoteNumber: this.order.Quote_Number__c || this.order.Epicor_Order_Number__c,
			});

			const link = document.createElement("a");
			link.href = "data:application/pdf;base64," + pdfBase64;
			link.download = name;
			link.dispatchEvent(new MouseEvent("click"));
		} catch (err) {
			auraExceptionHandler.logAuraException(err);

			this.dispatchEvent(
				new ShowToastEvent({
					variant: "error",
					title: "Ups, something went wrong",
					message: "There was an error fetching your quote, please contact the administrator",
				})
			);
		} finally {
			this.isLoading = false;
		}
	}

	quotePoNumberChanged(event){
		this.quotePoNumber = event.target.value;
	}
}
