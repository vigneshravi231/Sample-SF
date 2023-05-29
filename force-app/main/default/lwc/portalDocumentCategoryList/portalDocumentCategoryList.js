

import { api, LightningElement, track } from "lwc";
import getAllPortalDocumentCategories from "@salesforce/apex/PortalDocumentCategoryListController.getAllPortalDocumentCategories";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { NavigationMixin } from "lightning/navigation";

export default class PortalDocumentCategoryList extends NavigationMixin(LightningElement) {
  @api categoryId;
  @track topLevelCategories = [];
  isLoading = true;

  connectedCallback() {
    getAllPortalDocumentCategories({ categoryId: this.categoryId || null })
      .then(result => {
        console.log(result);
        this.topLevelCategories = result;
      })
      .catch(error => auraExceptionHandler.logAuraException(error))
      .finally(() => {
        this.isLoading = false;
      });
  }

  get categoryName() {
    return this.topLevelCategories[0]?.Parent_Category__r?.Name;
  }

  get hasCategories() {
    return this.topLevelCategories && this.topLevelCategories.length > 0;
  }

  navigateToDetail(event) {
    console.log(event.target.dataset.displayGallery, 'gallery');
    console.log(event.target.dataset.displayTable, 'table');
    this[NavigationMixin.Navigate]({
      type: 'comm__namedPage',
      attributes: {
        name: (event.target.dataset.displayGallery === "true" || event.target.dataset.displayTable === "true") ?
          'Portal_Document_Category__c' : 'Portal_Document_Category_List__c',
      },
      state: {
        categoryId: event.target.dataset.categoryId
      }
    });
    if(event.target.dataset.displayGallery !== "true") {
      getAllPortalDocumentCategories({ categoryId: event.target.dataset.categoryId })
        .then(result => {
          this.topLevelCategories = result;
        })
        .catch(error => auraExceptionHandler.logAuraException(error))
        .finally(() => {
          this.isLoading = false;
        });
    }
  }
}