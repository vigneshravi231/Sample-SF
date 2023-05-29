

import { LightningElement, track } from "lwc";
import fetchAssetsWithoutWarranties from "@salesforce/apex/AssetListWithoutWarrantiesController.fetchAssetsWithoutWarranties";
import getWebsiteUrl from "@salesforce/apex/CommunityController.getWebsiteUrl";
import {flattenJSON} from "c/utils";
import { NavigationMixin } from "lightning/navigation";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import {ContextProvider} from "c/communityContextProvider";

const actions = [
  {
    label: "Register Asset",
    name: "register"
  }
];

const columns = [
  {
    label: "Asset Name",
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
    label: "VIN/Serial Number",
    fieldName: "VIN_Serial_Number__c",
    sortable: true
  },
  {
    label: "Product Code",
    fieldName: "Product2.ProductCode",
    sortable: true
  },
  {
    label: "Dealer Name",
    fieldName: "Selling_Dealer__r.Name",
    sortable: true
  },
  {
    type: "action",
    typeAttributes: { rowActions: actions }
  }
];

export default class AssetListWithoutWarranties extends NavigationMixin(ContextProvider(LightningElement)) {

  @track pagination = {
    firstPage: 1,
    pageSize: 10,
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0
  };

  @track displayData = [];
  @track isLoading = false;
  @track sortDirection = "asc";
  @track sortedBy;
  @track query;

  columns = columns;

  defaultSortDirection = "asc";
  siteUrl;

  async connectedCallback() {
    try {
      this.siteUrl = await getWebsiteUrl();
      await this.search()
    } catch (err) {
      auraExceptionHandler.logAuraException(err);
    }
  }

  formatInfo(object) {
    return {
      ...flattenJSON(object),
      DirectLink: this.siteUrl + "/s/asset/" + object.Id + "/" + object.Name,
    };
  }


  async onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;

    await this.search();
  }

  async search() {
    this.isLoading = true;

    const { records, settings } = await fetchAssetsWithoutWarranties({
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

  handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    switch (actionName) {
      case "register":
        this.registerAsset(row);
        break;
      default:
    }
  }

  registerAsset(row) {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "Warranty_Registration__c"
      },
      state: {
        asset: row.Id
      }
    });
  }
}
