

import { LightningElement, track } from "lwc";
import fetchSavedClaims from "@salesforce/apex/SavedClaimsController.fetchSavedClaims";
import getWebsiteUrl from "@salesforce/apex/CommunityController.getWebsiteUrl";
import { flattenJSON } from "c/utils";
import { NavigationMixin } from "lightning/navigation";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ContextProvider } from "c/communityContextProvider";

const actions = [
  {
    label: "Resume Case",
    name: "resume"
  }
];

const columns = [
  {
    label: "CaseNumber",
    fieldName: "ObjectLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "CaseNumber"
      },
      value: {
        fieldName: "CaseNumber"
      },
      target: "ObjectLink"
    }
  },
  {
    label: "Account Number",
    fieldName: "Account_Number__c",
    sortable: true
  },
  {
    label: "Account Name",
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
    }
  },
  {
    label: "Asset Name",
    fieldName: "AssetLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "AssetName"
      },
      value: {
        fieldName: "AssetName"
      },
      target: "AssetLink"
    }
  },
  {
    label: "Date/Time Opened",
    fieldName: "CreatedDate",
    type: "date",
    sortable: true
  },
  {
    type: "action",
    typeAttributes: { rowActions: actions }
  }
];

export default class SavedClaimsList extends NavigationMixin(ContextProvider(LightningElement)) {

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
      await this.search();
    } catch (err) {
      auraExceptionHandler.logAuraException(err);
      this.isLoading = false;
    }
  }

  formatInfo(object) {
    return {
      ...flattenJSON(object),
      ObjectLink: this.siteUrl + "/s/case/" + object.Id + "/" + object.Name,
      AccountName: object.Account?.Name,
      AccountLink: this.siteUrl + "/s/account/" + object.AccountId + "/" + object.Account?.Name,
      AssetName: object.Asset?.Name,
      AssetLink: this.siteUrl + "/s/asset/" + object.AssetId + "/" + object.Asset?.Name
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

    const { records, settings } = await fetchSavedClaims({
      ctx: this.communityContext,
      input: {
        pagination: this.pagination,
        query: this.query,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
      }
    });

    this.pagination = settings;
    console.log(records, 'saved claims');
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
      case "resume":
        this.resumeCase(row);
        break;
      default:
    }
  }

  resumeCase(row) {
    const resumeEvent = new CustomEvent('resumecase', {
      detail: {
        caseId: row.Id
      }
    });
    this.dispatchEvent(resumeEvent);
  }
}
