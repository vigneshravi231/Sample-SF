

import { api, LightningElement, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";

import getWebsiteUrl from "@salesforce/apex/CommunityController.getWebsiteUrl";
import fetchRelatedWarrantyClaimCases from "@salesforce/apex/RelatedWarrantyClaimsListController.fetchRelatedWarrantyClaims";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import { ContextProvider } from "c/communityContextProvider";

const sortMap = {
  CreatedDateString: 'CreatedDate',
  UserLink: 'CreatedBy.Name',
  DirectLink: 'CaseNumber'
}

export default class AssetRelatedWarrantyClaimsList extends NavigationMixin(ContextProvider(LightningElement)) {

  @api recordId;
  @api viewWarranty;
  @api listLabel;
  @track displayedRows = [];

  isLoading = true;

  @track sortDirection = "asc";
  @track sortedBy;
  @track query = '';

  defaultSortDirection = "asc";
  siteUrl;

  @track pagination = {
    firstPage: 1,
    pageSize: 10,
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0
  };

  columns = [
    {
      label: "Case Number",
      fieldName: "DirectLink",
      type: "url",
      typeAttributes: {
        label: {
          fieldName: "CaseNumber"
        },
        value: {
          fieldName: "CaseNumber"
        },
        target: "DirectLink"
      },
      sortable: true
    },
    {
      label: "Subject",
      fieldName: "Subject",
      sortable: true
    },
    {
      label: "Opened By",
      fieldName: "UserLink",
      type: "url",
      typeAttributes: {
        label: {
          fieldName: "CreatedByName"
        },
        value: {
          fieldName: "CreatedByName"
        },
        target: "UserLink"
      },
      sortable: true
    },
    {
      label: "Date/Time Opened",
      fieldName: "CreatedDateString",
      sortable: true
    },
    {
      label: "Status",
      fieldName: "Status",
      sortable: true
    },
    {
      type: "action",
      typeAttributes: { rowActions: this.getRowActions }
    }
  ];

  async connectedCallback() {
    try {
      this.siteUrl = await getWebsiteUrl();
      await this.search();
    } catch (err) {
      auraExceptionHandler.logAuraException(err);
    }
  }

  get hasData(){
    return this.displayedRows?.length > 0;
  }

  get noDataMessage(){
    return this.viewWarranty
      ? 'No warranty claims found'
      : 'No cases found';
  }

  getRowActions(row, doneCallback) {
    if(row.Status === 'Rejected') {
      doneCallback([
        {
          label: "View Claim",
          name: "viewClaim"
        },
        {
          label: "Edit/Resubmit",
          name: "resubmit"
        }
      ]);
    } else {
      doneCallback([
        {
          label: "View Claim",
          name: "viewClaim"
        }
      ]);
    }
  }

  async search() {
    this.isLoading = true;

    const { records, settings } = await fetchRelatedWarrantyClaimCases({
      ctx: this.communityContext,
      input: {
        pagination: this.pagination,
        query: this.query,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
      },
      recordId: this.recordId,
      viewWarranty: this.viewWarranty
    });

    this.pagination = settings;
    this.displayedRows = records.map((item) => this.formatInfo(item));

    this.isLoading = false;
  }

  sortBy(field, reverse, primer) {
    const key = primer
      ? function (x) {
        return primer(x[field]);
      }
      : function (x) {
        return x[field];
      };

    return function (a, b) {
      a = key(a);
      b = key(b);
      return reverse * ((a > b) - (b > a));
    };
  }

  async onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    this.sortDirection = sortDirection;

    this.sortedBy = Object.keys(sortMap).includes(sortedBy) ? sortMap[sortedBy] : sortedBy;

    await this.search();

    this.sortedBy = sortedBy;
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

  resetPaginationToFirstPage() {
    this.pagination.currentPage = 1;
  }


  handleSearchQueryChange(event) {
    this.query = event.target.value.trim();
  }

  async handleSearchQueryKeyPress(event) {
    if (event.keyCode === 13) {
      this.resetPaginationToFirstPage();
      await this.search();
    }
  }

  formatInfo(obj) {
    return {
      ...obj,
      DirectLink: this.siteUrl + '/s/case/' + obj.Id,
      CreatedByName: obj.CreatedBy.Name,
      CreatedDateString: new Date(obj.CreatedDate).toLocaleString(),
      UserLink: this.siteUrl + '/s/user/' + obj.CreatedBy.Id
    }
  }

  handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    switch (actionName) {
      case "viewClaim":
        this.navigateToClaim(row);
        break;

      case "resubmit":
        this.resubmitClaim(row);
        break;

      default:
    }
  }

  navigateToClaim(row) {
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: row.Id,
        objectApiName: 'Case',
        actionName: 'view'
      }
    });
  }

  resubmitClaim(row) {
    const val = {
      CaseId: row.Id
    };
    const resubmitEvent = new CustomEvent("resubmit", {
      detail: val
    });
    this.dispatchEvent(resubmitEvent);
  }
}
