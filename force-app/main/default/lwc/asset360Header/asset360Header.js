

import { LightningElement, api, track } from "lwc";

import { sureThing } from "c/utils";
import _fetch from "@salesforce/apex/Asset360HeaderController.fetch";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { NavigationMixin } from "lightning/navigation";

import {ContextProvider} from "c/communityContextProvider";

const $fetch = sureThing(_fetch);

export default class Asset360Header extends NavigationMixin(ContextProvider(LightningElement)) {
	@api recordId;
	@api startFlow;
	@track isLoading = true;

	asset = {};
	recalls = [];
	warranty = {};
	part = {};
	isAssetRegistered;

	async connectedCallback() {
		const assetId = this.recordId;
		this.isLoading = true;

		const { ok, error, data } = await $fetch({ ctx: this.communityContext, assetId });

		if (ok) {
			const { asset, recalls, part, warranty, isAssetRegistered } = data;

			console.log(data, 'asset info');

			this.setAssetInformation(asset);
			this.recalls = recalls;
			this.part = JSON.parse(JSON.stringify(part));
			this.warranty = warranty;
			this.isAssetRegistered = isAssetRegistered;
		} else {
			auraExceptionHandler.logAuraException(error);
		}

		this.isLoading = false;
	}

	get VINorSerial() {
		return this.asset?.Part_Class__c === 'FGCV' ? 'VIN' : 'Serial';
	}

	get hasWarranty() {
		return this.isAssetRegistered;
	}

	get hasAccessToWarranty(){
		return !!this.warranty;
	}

	get hasRecalls() {
		return !!this.recalls && this.recalls.length > 0;
	}

	get isLift() {
		return this.asset?.Part_Class__c === "FGLI";
	}

	get isVehicle() {
		return this.part?.Vehicles__c;
	}

	setAssetInformation(asset) {
		this.asset = asset;

		let today = new Date();
		let titleDate = new Date(this.asset.TitleWebLinkActiveDate__c);
		let windowStickerDate = new Date(this.asset.WinStickTitleWebLinkActiveDate__c);

		this.asset.showTitle = this.asset.TitleWebLinkeActive__c
			&& today.getTime() > titleDate.getTime();
		this.asset.showWindowSticker = this.asset.WinStickTitleWebLinkeActive__c
			&& today.getTime() > windowStickerDate.getTime();
		this.asset.ProductName = this.asset.Product2?.Name;
	}

	gotoWarrantyRegistration() {
		this[NavigationMixin.Navigate]({
			type: "comm__namedPage",
			attributes: {
				name: "Warranty_Registration__c",
			},
			state: {
				asset: this.recordId,
			},
		});
	}

	navigateToClaims() {
		this[NavigationMixin.Navigate]({
			type: "comm__namedPage",
			attributes: {
				name: "Warranty_Claims__c"
			},
			state: {
				recordId: this.recordId
			}
		});
	}

	newLiftCase() {
		const val = {
			VIN_Serial_Number__c: this.asset.VIN_Serial_Number__c,
			AccountId: this.asset.AccountId,
			ProductCode: this.part.fields.ProductCode
		};
		const createCaseEvent = new CustomEvent("newliftcase", {
			detail: val
		});
		this.dispatchEvent(createCaseEvent);
	}

	newVehicleCase() {
		const val = {
			VIN_Serial_Number__c: this.asset.VIN_Serial_Number__c,
			AccountId: this.asset.AccountId
		};
		const createCaseEvent = new CustomEvent("newvehiclecase", {
			detail: val
		});
		this.dispatchEvent(createCaseEvent);
	}
}
