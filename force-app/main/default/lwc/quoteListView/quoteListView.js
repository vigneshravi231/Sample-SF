

import { LightningElement, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import fetchAllQuotes from "@salesforce/apex/QuoteListViewController.fetchAllQuotes";
import getWebsiteUrl from "@salesforce/apex/CommunityController.getWebsiteUrl";

const actions = [
  {
    label: "View Details",
    name: "details"
  }
];

const columns = [
  {
    label: "Quote Number",
    fieldName: "DirectLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "OrderNumber"
      },
      value: {
        fieldName: "OrderNumber"
      },
      target: "DirectLink"
    }
  },
  {
    label: "Ordered Date",
    fieldName: "CreatedDate",
    type: "date",
    typeAttributes: {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    },
    sortable: true
  },
  {
    label: "Quote Expiration Date",
    fieldName: "QuoteExpiration",
    type: "date",
    typeAttributes: {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    },
    sortable: true
  },
  {
    label: "Total",
    fieldName: "GrandTotalAmount",
    type: "currency",
    sortable: true
  },
  {
    label: "Account",
    fieldName: "AccountLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "AccountName"
      },
      value: {
        fieldName: "AccountName"
      },
      target: "AccountLink"
    },
    sortable: true
  },
  {
    label: "Requested By",
    fieldName: "CreatedByName",
    sortable: true
  },
  {
    type: "action",
    typeAttributes: { rowActions: actions }
  }
];

export default class QuoteListView extends NavigationMixin(LightningElement) {
  @track pagination = {
    firstPage: 1,
    pageSize: 10,
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0
  };

  @track query = "";
  @track displayData = [];
  @track isLoading = false;

  columns = columns;

  siteUrl;

  defaultSortDirection = "DESC";
  sortDirection = "DESC";
  sortedBy = "CreatedDate";

  async search() {
    this.isLoading = true;

    const { records, settings } = await fetchAllQuotes({
      input: {
        pagination: this.pagination,
        query: this.query,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
      }
    });

    this.pagination = settings;
    this.displayData = records.map((item) => this.formatInfo(item));

    console.log('data', JSON.parse(JSON.stringify(records)));

    this.isLoading = false;
  }

  handleSearchQueryChange(event) {
    this.query = event.target.value;
  }

  async handleSearchQueryKeyPress(event) {
    if (event.keyCode === 13) {
      this.resetPaginationToFirstPage();
      await this.search();
    }
  }

  async connectedCallback() {
    try {
      this.siteUrl = await getWebsiteUrl();
      await this.search()
    } catch (err) {
      auraExceptionHandler.logAuraException(err);
    }
  }

  resetPaginationToFirstPage() {
    this.pagination.currentPage = 1;
  }

  async handlePaginationChange(event) {
    this.isLoading = true;

    const paginationDiff = event.detail;

    this.pagination = {
      ...this.pagination,
      ...paginationDiff
    };

    await this.search();

    this.isLoading = false;
  }

  formatInfo(object) {
    let quoteExpDate = object.OriginalOrder?.QuoteEXPDate__c?.split('-');
    return {
      ...object,
      AccountName: object.Account?.Name,
      AccountLink: this.siteUrl + "/s/account/" + object.AccountId,
      CreatedByName: object.CreatedBy.Name,
      DirectLink: this.siteUrl + "/s/OrderSummary/" + object.Id,
      QuoteExpiration: quoteExpDate.length === 3 ? new Date(quoteExpDate[0], quoteExpDate[1] - 1, quoteExpDate[2]).toDateString() : null
    };
  }

  handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    switch (actionName) {
      case "details":
        this.viewDetails(row);
        break;
      default:
    }
  }

  viewDetails(row) {
    const { Id } = row;
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: Id,
        objectApiName: 'OrderSummary',
        actionName: 'view'
      }
    });
  }

  async onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;

    await this.search();
  }
}
