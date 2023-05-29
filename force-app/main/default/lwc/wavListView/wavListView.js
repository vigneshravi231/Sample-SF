

import { LightningElement, api, track } from "lwc";

import fetchChassis from "@salesforce/apex/WavListViewController.fetchChassis";
import { NavigationMixin } from "lightning/navigation";

const TYPE_CONVERTED = "Chassis - Converted";
const TYPE_UNCONVERTED = "Chassis - Unconverted";

const CHASSIS_TYPE = {
	converted: TYPE_CONVERTED,
	unconverted: TYPE_UNCONVERTED,
};

import {ContextProvider} from "c/communityContextProvider";

export default class WavListView extends NavigationMixin(ContextProvider(LightningElement)) {
	@track foundChassis = {
		converted: [],
		unconverted: [],
	};

	@track isLoading = false;
	@track caseModalIsOpen = false;
	@track dealerLocateModalOpen = false;

	@track
	configuratorFields = [
		{
			section: 1,
			label: 'Chassis/Conversion',
			fields: [
				{
					name: "Product__r.Chassis_Type__c",
					label: "Chassis Type",
					dependsOn: [],
					excludeOptions: ["Customer", "Dealer Locate"]
				},
				{
					name: "Conversion_Type__c",
					label: "Conversion Type",
					dependsOn: [],
				},
			]
		},
		{
			section: 2,
			label: 'Vehicle',
			fields: [
				{
					name: "Product__r.Year__c",
					label: "Year",
					dependsOn: [],
				},
				{
					name: "Product__r.Make__c",
					label: "Make",
					dependsOn: [],
				},
				{
					name: "Product__r.Model__c",
					label: "Model",
					dependsOn: ["Product__r.Make__c"],
				},
			]
		},
		{
			section: 3,
			label: 'Colors/Packages',
			fields: [
				{
					name: "Product__r.Trim_Identifier__c",
					label: "Trim",
					dependsOn: ["Product__r.Make__c", "Product__r.Model__c", "Product__r.Year__c"],
				},
				{
					name: "Product__r.Exterior_Color__c",
					label: "Exterior Color",
					dependsOn: ["Product__r.Make__c"],
				},
				{
					name: "Product__r.Interior_Color__c",
					label: "Interior Color",
					dependsOn: ["Product__r.Make__c"],
				},
			]
		}
	];

	@track
	selectedFilter = {};

	@track
	pagination = {
		converted: {
			firstPage: 1,
			pageSize: 10,
			currentPage: 1,
			totalPages: 1,
			totalRecords: 0,
		},
		unconverted: {
			firstPage: 1,
			pageSize: 10,
			currentPage: 1,
			totalPages: 1,
			totalRecords: 0,
		},
	};

	async handleConfigChange(event) {
		const config = event.detail;

		this.selectedFilter = config;
		this.resetPaginationToFirstPage();

		await this.search();
	}

	async connectedCallback() {
		await this.search();
	}

	async search() {
		this.isLoading = true;

		await Promise.all([this.searchChassis("converted"), this.searchChassis("unconverted")]);

		this.isLoading = false;
	}

	async searchChassis(type) {
		const { simpleProducts, paginationResult } = await fetchChassis({
			ctx: this.communityContext,
			settings: this.pagination[type],
			filter: { ...this.selectedFilter, VINType__c: CHASSIS_TYPE[type] },
		});

		const { records, settings } = paginationResult;

		console.log("records", records);
		console.log("settings", settings);

		this.foundChassis[type] = records.map(inventory => ({
			...inventory,
			price: type === TYPE_CONVERTED
				? (inventory.Chassis_Price__c || 0) + (inventory.Conversion_Price__c || 0)
				: inventory.Chassis_Price__c, // unconverted
		}));
		this.pagination[type] = settings;
	}

	resetPaginationToFirstPage() {
		this.pagination.converted.currentPage = 1;
		this.pagination.unconverted.currentPage = 1;
	}

	async handlePaginationChange(event) {
		this.isLoading = true;

		const paginationDiff = event.detail;
		const { type } = event.target.dataset;

		this.pagination[type] = {
			...this.pagination[type],
			...paginationDiff,
		};

		await this.searchChassis(type);

		this.isLoading = false;
	}

	openCaseModal() {
		this.caseModalIsOpen = true;
	}

	closeCaseModal() {
		this.caseModalIsOpen = false;
	}

	openDealerLocateModal() {
		this.dealerLocateModalOpen = true;
	}

	closeDealerLocateModal() {
		this.dealerLocateModalOpen = false;
	}

	goToProductDetail(event) {
		const { inventoryId, productId } = event.detail;

		this[NavigationMixin.Navigate]({
			type: "standard__recordPage",
			attributes: {
				recordId: productId,
				objectApiName: "Product2",
				actionName: "view",
			},
			state: {
				inventoryId
			}
		});
	}
}
