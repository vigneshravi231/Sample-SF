

import { LightningElement, track } from "lwc";
import getReplacements from "@salesforce/apex/HistoricalPartsController.getReplacements";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class FindMyPartsButton extends LightningElement {
	@track partsModalIsOpen = false;
	@track query = "";
	@track isLoading = false;

	_replacements = [];

	get replacements() {
		return this._replacements || [];
	}

	get hasReplacements() {
		return (
			this.replacements.length > 0 &&
			this.replacements[0].HistoricalPartsList_PartNum !== this.replacements[0].HistoricalPartsList_ReplacementPart_c
		);
	}

	get modal() {
		return this.template.querySelector("c-modal-dialog");
	}

	openModal() {
		this.query = '';
		this._replacements = [];

		this.modal.show();
	}

	handleQueryChange(event) {
		this.query = event.target.value;
	}

	async handleSearchEnter(event) {
		if (event.keyCode === 13) {
			await this.searchReplacement();
		}
	}

	async searchReplacement() {
		this.isLoading = true;

		try {
			this._replacements = await getReplacements({ partNumber: this.query });

			if (!this.hasReplacements) {
				this.dispatchEvent(new CustomEvent("noreplacementfound", { detail: { partNumber: this.query } }));
				this.modal.hide();
			}
		} catch (err) {
			auraExceptionHandler.logAuraException(err);

			this.dispatchEvent(
				new ShowToastEvent({
					title: "An error has occurred",
					message: "Please contact your Salesforce administrator.",
					variant: "error",
				})
			);
		} finally {
			this.isLoading = false;
		}
	}

	handleReplacementClick(event) {
		event.preventDefault();

		const { partNumber } = event.target.dataset;

		this.dispatchEvent(
			new CustomEvent("replacementselect", {
				detail: { partNumber },
			})
		);

		this.modal.hide();
	}
}
