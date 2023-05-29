

import { api, LightningElement } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import getAllPortalDocumentsByCategory from "@salesforce/apex/PortalDocumentCategoryDetailController.getAllPortalDocumentsByCategory";

export default class PortalDocumentCategoryDetail extends LightningElement {
  @api categoryId;
  portalDocuments = [];
  columnHeaders = [];
  columnData = [];
  categoryInfo;

  connectedCallback() {
    getAllPortalDocumentsByCategory({ categoryId: this.categoryId })
      .then(result => {
        if(result.length > 0) {
          this.categoryInfo = result[0];
          if(result[0].Display_as_Table__c) {
            this.columnHeaders = result[0]?.Header_Labels__c?.split(',');

            this.columnData = result[0].Portal_Documents__r?.map((item) => {
              let arr = item.Column_Data__c?.split(',');
              let obj = [];
              this.columnHeaders.forEach((label, index) => {
                if(arr[index].split(';').length === 2) {
                  let info = arr[index].split(';');
                  obj = [...obj, {
                    id: item.Id + index,
                    label: info[0],
                    value: info[1],
                    link: true
                  }];
                } else {
                  obj = [...obj, {
                    label: arr[index],
                    link: false
                  }];
                }
              });
              return {
                Id: item.Id,
                data: obj
              };
            });
          }
          this.portalDocuments = result[0].Portal_Documents__r;
        }
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }

  get categoryName() {
    return this.categoryInfo?.Parent_Category__r?.Name;
  }

  get subcategoryName() {
    return this.categoryInfo?.Name;
  }

  get hasDocuments() {
    return this.portalDocuments && this.portalDocuments?.length > 0;
  }

  get hasColumnData() {
    return this.columnData?.length > 0 && this.columnHeaders?.length > 0;
  }
}