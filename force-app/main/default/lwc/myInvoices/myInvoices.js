

import { LightningElement, track } from "lwc";

import searchInvoices from "@salesforce/apex/InvoiceController.searchInvoices";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import {ContextProvider} from "c/communityContextProvider";

const COLUMNS = [
	{
		label: "Invoice Link",
		fieldName: "nameUrl",
		type: "url",
		typeAttributes: {
			label: "View Invoice",
			target: "_blank",
		},
	},
	{ label: "Name", fieldName: "Name", sortable: true },
	{ label: "Due Date", fieldName: "acSales__DueDate__c", type: "date", sortable: true },
	{ label: "Invoice Date", fieldName: "acSales__InvoiceDate__c", type: "date", sortable: true },
	{ label: "Closed Date", fieldName: "acSales__ClosedDate__c", type: "date", sortable: true },
	{ label: "PO Number", fieldName: "PO_Number__c", sortable: true },
];

export default class MyInvoices extends ContextProvider(LightningElement) {
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

	@track invoices;
	invoiceCount;

	isLoading = false;
	columns = COLUMNS;

	async connectedCallback() {
		await this.search();
	}

	async search() {
		this.isLoading = true;

		try {
			const input = {
				pagination: this.pagination,
				query: this.query,
				sortedBy: this.sortedBy,
				sortDirection: this.sortDirection,
			};
			const { records, settings } = await searchInvoices({
				ctx: this.communityContext,
				input,
			});

			this.pagination = settings;
			this.invoices = records.map(invoice => ({
				...invoice,
				nameUrl: invoice.Web_Link_Active__c
					? invoice.Invoice_Web_Link__c
					: null,
			}));
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
		} finally {
			this.isLoading = false;
		}
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

	get invoicesExist() {
		return this.pagination.totalRecords > 0;
	}
}
