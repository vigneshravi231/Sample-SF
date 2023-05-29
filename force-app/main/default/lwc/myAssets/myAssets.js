

import { LightningElement, track } from "lwc";

import { auraExceptionHandler } from "c/auraExceptionHandler";
import { flattenJSON } from "c/utils";

import searchAssets from "@salesforce/apex/AssetController.search";
import getWebsiteUrl from "@salesforce/apex/CommunityController.getWebsiteUrl";

import { ContextProvider } from "c/communityContextProvider";

const COLUMNS = [
	{ label: "Created Date", fieldName: "CreatedDate", type: "date", sortable: true },
	{
		label: "Name",
		fieldName: "assetUrl",
		type: "url",
		typeAttributes: {
			label: { fieldName: "Name" },
			target: "_self",
		},
		sortable: true,
	},
	{ label: "VIN", fieldName: "VIN_Serial_Number__c", sortable: true },
	{ label: "Last Recorded Mileage", fieldName: "Last_Recorded_Mileage__c", type: "number", sortable: true },
	{
		label: "Product Name",
		fieldName: "productUrl",
		type: "url",
		typeAttributes: {
			label: { fieldName: "Product2.Name" },
			target: "_self",
		},
		sortable: true,
	},
	{ label: "Purchase Date", fieldName: "CleanedPurchaseDate", type: "date", sortable: true },
	{ label: "Manufacturing Date", fieldName: "CleanedManufacturingDate", type: "date", sortable: true },
	{ label: "Status", fieldName: "Status", sortable: true },
];

const SORT_FIELD_MAP = {
	'assetUrl' : 'Name',
	'accountUrl' : 'Account.Name',
	'productUrl' : 'Product2.Name',
}

export default class MyAssets extends ContextProvider(LightningElement) {
	@track pagination = {
		firstPage: 1,
		pageSize: 25,
		currentPage: 1,
		totalPages: 1,
		totalRecords: 0,
	};

	@track query;
	@track sortDirection = "DESC";
	@track sortedBy = "CreatedDate";

	@track assets = [];

	isLoading = false;
	columns = COLUMNS;

	_siteUrl

	async connectedCallback() {
		this._siteUrl = await getWebsiteUrl();
		await this.search();
	}

	async search() {
		this.isLoading = true;

		try {
			const input = {
				pagination: this.pagination,
				query: this.query,
				sortedBy: SORT_FIELD_MAP[this.sortedBy] || this.sortedBy,
				sortDirection: this.sortDirection,
			};
			const { records, settings } = await searchAssets({ ctx: this.communityContext, input });
			console.log(JSON.parse(JSON.stringify(records)));
			console.log(JSON.parse(JSON.stringify(settings)));

			this.pagination = settings;
			this.assets = records.map(asset => ({
				...flattenJSON(asset),
				assetUrl: this.createLink('asset', asset.Id, asset.Name),
				accountUrl: this.createLink('account', asset.AccountId, asset.Account?.Name),
				productUrl: this.createLink('product', asset.Product2Id, asset.Product2?.Name),
				CleanedPurchaseDate: this.cleanDate(asset.PurchaseDate),
				CleanedManufacturingDate: this.cleanDate(asset.Manufacturing_Date__c)
			}))
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
		} finally {
			this.isLoading = false;
		}
	}

	createLink(page, sfid, name){
		return `${this._siteUrl}/s/${page}/${sfid}/${name}`;
	}

	cleanDate(date) {
		const dateComponents = date?.split('-');
		return dateComponents?.length === 3 ? new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]).toDateString() : null;
	}

	async onHandleSort(event) {
		const { fieldName: sortedBy, sortDirection } = event.detail;
		this.sortDirection = sortDirection;
		this.sortedBy = sortedBy;

		await this.search();
	}

	async onPaginationChange(event){
		const paginationDiff = event.detail;

		this.pagination = {
			...this.pagination,
			...paginationDiff
		};

		await this.search();
	}

	async handleSearchQueryKeyPress(event) {
		if (event.keyCode === 13) {
			this.resetPaginationToFirstPage();
			await this.search();
		}
	}

	resetPaginationToFirstPage() {
		this.pagination.currentPage = 1;
	}

	handleSearchQueryChange(event) {
		this.query = event.target.value;
	}

	get assetsExist() {
		return this.pagination.totalRecords > 0;
	}
}
