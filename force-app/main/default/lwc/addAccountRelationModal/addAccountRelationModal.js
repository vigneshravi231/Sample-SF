

import { LightningElement, api, track } from "lwc";

import fetchSharableAccounts from "@salesforce/apex/AccountContactRelationController.fetchSharableAccountsFor";
import shareAccounts from "@salesforce/apex/AccountContactRelationController.shareAccountsWithUser";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class AddAccountRelationModal extends LightningElement {
	@track selectedOptions = [];
	@track isLoading = false;
	@track user = {};

	_availableAccounts = []

	get availableOptions() {
		return (this._availableAccounts || []).map(a => ({
			label: `${a.AccountNumber_External_ID__c || ''}  - ${a.Name}`,
			value: a.Id,
		}));
	}

	get modal(){
		return this.template.querySelector("c-modal-dialog");
	}

	@api
	async open(user) {
		this.selectedOptions = [];
		this._availableAccounts = [];

		this.modal.show();

		this.isLoading = true;
		this.user = user;

		try {
			const { available, shared } = await fetchSharableAccounts({
				userID: user.Id,
			});
			this._availableAccounts = available;
			this.selectedOptions = shared.map(a => a.Id);
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
		}
		finally {
			this.isLoading = false;
		}
	}

	handleSelection(event) {
		this.selectedOptions = event.detail.value;
	}

	closeModal(){
		this.modal.hide();
	}

	async saveSharing(){
		this.isLoading = true;

		try {
			await shareAccounts({
				userID: this.user.Id,
				accountIDs: this.selectedOptions || [],
			})
			this.closeModal();
		} catch (err) {
			this.dispatchEvent(new ShowToastEvent({
				variant: "error",
				title: "Error",
				message: "An error occurred when sharing selected accounts with contact, please try again later"
			}))
			auraExceptionHandler.logAuraException(err);
		}
		finally {
			this.isLoading = false;
		}

	}
}
