

import { LightningElement, track } from "lwc";
import fetchAllWarrantyRegistrations from "@salesforce/apex/WarrantyListViewController.fetchAllWarrantyRegistrations";
import downloadPdfs from "@salesforce/apex/WarrantyRegistrationFormController.downloadPdfs";
import { flattenJSON } from "c/utils";
import getWebsiteUrl from "@salesforce/apex/CommunityController.getWebsiteUrl";
import { NavigationMixin } from "lightning/navigation";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import {ContextProvider} from "c/communityContextProvider";

const actions = [
  {
    label: "View Details",
    name: "details"
  }
];

const columns = [
  {
    label: "Warranty Name",
    fieldName: "DirectLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "Name"
      },
      value: {
        fieldName: "Name"
      },
      target: "DirectLink"
    }
  },
  {
    label: "Asset Name",
    fieldName: "Asset.Name",
    sortable: true
  },
  {
    label: "VIN/Serial Number",
    fieldName: "VIN_Serial_Number__c",
    sortable: true
  },
  {
    label: "Account Name",
    fieldName: "Account.Name",
    sortable: true
  },
  {
    label: "Dealer Name",
    fieldName: "Dealer__r.Name",
    sortable: true
  },
  {
    label: "Dealer Number",
    fieldName: "Dealer_ID__c",
    sortable: true
  },
  {
    label: "Created By",
    fieldName: "CreatedBy.Name",
    sortable: true
  },
  {
    type: "action",
    typeAttributes: { rowActions: actions }
  }
];

export default class WarrantyListView extends NavigationMixin(ContextProvider(LightningElement)) {
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

  selectedRows = [];
  isDownloading = false;

  defaultSortDirection = "asc";
  sortDirection = "asc";
  sortedBy;

  async search() {
    this.isLoading = true;

    const { records, settings } = await fetchAllWarrantyRegistrations({
      ctx: this.communityContext,
      input: {
        pagination: this.pagination,
        query: this.query,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
      }
    });

    this.pagination = settings;
    this.displayData = records.map((item) => this.formatInfo(item));

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

  get noSelection() {
    return this.selectedRows.length === 0 || this.isDownloading;
  }

  get downloadText() {
    return this.isDownloading ? "Downloading..." : "Download";
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

  handleRowSelection() {
    this.selectedRows = this.template
      .querySelector("lightning-datatable")
      .getSelectedRows();
  }

  formatInfo(object) {
    return {
      ...flattenJSON(object),
      DirectLink: this.siteUrl + "/s/warranty-registration-detail?recordId=" + object.Id
    };
  }

  navigateToCreateForm() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "Warranty_Registration__c"
      }
    });
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
      type: "comm__namedPage",
      attributes: {
        name: "Warranty_Registration_Detail__c"
      },
      state: {
        recordId: Id
      }
    });
  }

  async onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;

    await this.search();
  }

  downloadSelected() {
    const selectedIds = this.selectedRows.map((item) => item.Id);
    this.isDownloading = true;
    downloadPdfs({ entitlementIdList: selectedIds })
      .then((result) => {
        this.isDownloading = false;
        this[NavigationMixin.Navigate]({
          type: "standard__webPage",
          attributes: {
            url: result
          }
        });
      })
      .catch((error) => {
        this.isDownloading = false;
        this.fireToastEvent(
          "Something went wrong.",
          "We were unable to download the registrations. Please contact your Salesforce Administrator.",
          "error"
        );
        auraExceptionHandler.logAuraException(error);
      });
  }

  fireToastEvent(title, message, variant) {
    const evt = new ShowToastEvent({
      title,
      message,
      variant
    });
    this.dispatchEvent(evt);
  }
}
