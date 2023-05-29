

import { LightningElement, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { flattenJSON } from "c/utils";


import fetchCases from "@salesforce/apex/MapFundsController.fetchMapRequestCases";
import fetchMapRequests from "@salesforce/apex/MapFundsController.fetchCompletedMapRequests";

const CASES_KEY = "cases";
const MAP_REQUESTS_KEY = "requests";

const RESOLVE_FETCH_FN = {
  [CASES_KEY]: fetchCases,
  [MAP_REQUESTS_KEY]: fetchMapRequests
};

export default class MapTabsList extends NavigationMixin(LightningElement) {

  tabs = {
    [CASES_KEY]: CASES_KEY,
    [MAP_REQUESTS_KEY]: MAP_REQUESTS_KEY
  };

  @track isLoading = false;
  @track currentTab = CASES_KEY;

  @track data = {
    [CASES_KEY]: {
      records: [],
      pagination: {
        firstPage: 1,
        pageSize: 10,
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0
      },
      columns: CASE_COLUMNS,
      query: "",
      sortedBy: "CreatedDate",
      sortDirection: "DESC"
    },
    [MAP_REQUESTS_KEY]: {
      records: [],
      pagination: {
        firstPage: 1,
        pageSize: 10,
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0
      },
      columns: MAP_REQUEST_COLUMNS,
      query: null,
      sortedBy: "CreatedDate",
      sortDirection: "DESC"
    }
  };

  async connectedCallback() {
    await Promise.all([
      this.search(CASES_KEY),
      this.search(MAP_REQUESTS_KEY)
    ]);
  }

  formatInfo(record, objectName) {
    const flatten = flattenJSON(record);

    switch (objectName) {
      case CASES_KEY:
        return {
          ...flatten,
          CaseLink: "/customercareplus/s/case/" + record.Id,
          SubjectLink: "/customercareplus/s/case/" + record.Id,
          ContactLink: "/customercareplus/s/contact/" + record.ContactId
        };
      case MAP_REQUESTS_KEY:
        return {
          ...flatten,
          MapRequestLink: "/customercareplus/s/map-request/" + record.Id,
          AccountLink: "/customercareplus/s/account/" + record.Account__c
        };
    }
  }

  async onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;

    const tab = this.currentTab;

    this.data[tab].sortedBy = sortedBy;
    this.data[tab].sortDirection = sortDirection;

    await this.search(tab);
  }

  resolveSortField(field){
    const linksToFields = {
      CaseLink: 'CaseNumber',
      SubjectLink: 'Subject',
      ContactLink: 'Contact.Name',
      MapRequestLink: 'Name',
      AccountLink: 'Account__r.Name'
    };

    return linksToFields[field] || field;
  }

  handleTabChange(event){
    this.currentTab = event.target.dataset.objectName;
  }

  async search(objectKey) {
    this.isLoading = true;

    try {
      const fetch = RESOLVE_FETCH_FN[objectKey];
      const input = {
        pagination: this.data[objectKey].pagination,
        query: this.data[objectKey].query,
        sortDirection: this.data[objectKey].sortDirection,
        sortedBy: this.resolveSortField(this.data[objectKey].sortedBy)
      };

      const { records, settings: pagination } = await fetch({ input });

      this.data[objectKey].records = records.map(r => this.formatInfo(r, objectKey));
      this.data[objectKey].pagination = pagination;

    } catch (err) {

      auraExceptionHandler.logAuraException(err);

    } finally {
      this.isLoading = false;
    }
  }

  handleSearchQueryChange(event) {
    const { tab } = event.target.dataset;
    this.data[tab].query = event.target.value;
  }

  async handleSearchQueryKeyPress(event) {
    if (event.keyCode === 13) {
      const { tab } = event.target.dataset;
      this.resetPaginationToFirstPage(tab);
      await this.search(tab);
    }
  }

  resetPaginationToFirstPage(tab) {
    this.data[tab].pagination.currentPage = 1;
  }

  async handlePaginationChange(event) {
    const { tab } = event.target.dataset;
    const paginationDiff = event.detail;

    this.pagination = {
      ...this.pagination,
      ...paginationDiff
    };

    await this.search(tab);
  }
}


const MAP_REQUEST_COLUMNS = [
  {
    label: "Map Request #",
    fieldName: "MapRequestLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "Name"
      },
      target: "DirectLink"
    },
    sortable: true
  },
  {
    label: "Account",
    fieldName: "AccountLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "Account__r.Name"
      },
      target: "DirectLink"
    },
    sortable: true
  },
  {
    label: "Created At",
    fieldName: "CreatedDate",
    sortable: true
  },
  {
    label: "MAP Amount",
    fieldName: "MAP_amount__c",
    sortable: true
  },
  {
    label: "Type",
    fieldName: "RecordType.DeveloperName",
    sortable: true
  }
];

const CASE_COLUMNS = [
  {
    label: "Case Number",
    fieldName: "CaseLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "CaseNumber"
      },
      target: "DirectLink"
    },
    sortable: true
  },
  {
    label: "Contact",
    fieldName: "ContactLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "Contact.Name"
      },
      target: "DirectLink"
    },
    sortable: true
  },
  {
    label: "Subject",
    fieldName: "SubjectLink",
    type: "url",
    typeAttributes: {
      label: {
        fieldName: "Subject"
      },
      target: "DirectLink"
    },
    sortable: true
  },
  {
    label: "Status",
    fieldName: "MAP_approval_status__c",
    sortable: true
  },
  {
    label: "MAP Amount",
    fieldName: "MAP_amount__c",
    type: "currency",
    sortable: true
  },
  {
    label: "Created Date",
    fieldName: "CreatedDate",
    type: "date",
    sortable: true
  }
];

