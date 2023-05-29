

import { api, LightningElement, track } from "lwc";
import getAccountDetails from "@salesforce/apex/RequestHoldModalController.getAccountDetails";
import createHoldCase from "@salesforce/apex/RequestHoldModalController.createHoldCase";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import {ContextProvider} from "c/communityContextProvider";

export default class RequestHoldModal extends ContextProvider(LightningElement) {
	@api chassisVin;
	@api chassisPartNumber;
	@api stock;
	@api inventoryId;

	@api show() {
		this.modal.show();
	}

	@track isLoading = true;
	@track accountNumber;
	@track accountId;
	@track recordTypeId;
	@track requestedQuantity;
	@track reasonForHold;

	async connectedCallback() {
		this.isLoading = true;
		try {
			const result = await getAccountDetails({
				ctx: this.communityContext,
			});
			this.accountNumber = result.account?.AccountNumber;
			this.accountId = result.account?.Id;
			this.recordTypeId = result.chassisHoldRecordTypeId;
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
			this.dispatchEvent(
				new ShowToastEvent({
					variant: "error",
					title: "Error",
					message: "There was an issue obtaining inventory information, please contact your administrator",
				})
			);
		}
	}

	async onCaseSubmit(event) {
		event.preventDefault();
		this.isLoading = true;

		try {
			const fields = event.detail.fields;

			fields.RecordTypeId = this.recordTypeId;
			fields.Subject = "Chassis Hold";
			fields.AccountId = this.accountId;
			fields.AccountNumber__c = this.accountNumber;
			fields.Description = this.reasonForHold;
			fields.Quantity_Requested__c = this.requestedQuantity;

			await createHoldCase({ cs: fields, inventoryId: this.inventoryId });
			this.onSuccess();
		} catch (err) {
			this.dispatchEvent(
				new ShowToastEvent({
					variant: "error",
					title: "Error",
					message: "There was an error submitting your case, please contact your administrator",
				})
			);
			auraExceptionHandler.logAuraException(err);
		} finally {
			this.isLoading = false;
		}
	}

	get quantityLabel() {
		return `Requested Quantity (max ${this.stock})`;
	}

	get disableSubmit() {
		return !this.requestedQuantity || this.requestedQuantity > this.stock || !this.reasonForHold;
	}

	get modal() {
		return this.template.querySelector("c-modal-dialog");
	}

	updateQuantity(event) {
		this.requestedQuantity = parseInt(event.target.value);
	}

	handleReasonForHoldChange(event) {
		this.reasonForHold = event.target.value;
	}

	onLoad() {
		this.isLoading = false;
	}

	onSuccess() {
		this.requestedQuantity = null;
		this.reasonForHold = null;
		this.dispatchEvent(
			new ShowToastEvent({
				title: "Case successfully submitted!",
				message: "You will receive a confirmation email shortly.",
				variant: "success",
			})
		);
		this.isLoading = false;
		this.modal.hide();
		this.dispatchEvent(new CustomEvent('submitted'));
	}

	onError(event) {
		console.log("Error: ", JSON.parse(JSON.stringify(event.detail)));
		this.dispatchEvent(
			new ShowToastEvent({
				title: "An error has occurred.",
				message: "Your Salesforce admin has been notified.",
				variant: "error",
			})
		);
		this.isLoading = false;
	}
}
