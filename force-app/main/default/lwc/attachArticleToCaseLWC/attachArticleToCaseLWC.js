


import { api, LightningElement } from "lwc";
import attachArticleToCase from "@salesforce/apex/AttachArticleToCaseController.attachArticleToCase";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { auraExceptionHandler } from "c/auraExceptionHandler";

export default class AttachArticleToCaseLWC extends LightningElement {
  @api recordId;

  onSubmit(event) {
    event.preventDefault();
    attachArticleToCase({ recordId: this.recordId, caseId: event.detail.fields.Case__c })
      .then(result => {
        console.log(result);
        if(result) {
          this.showToast('Success!', 'This article has been successfully linked to your case.', 'success');
        } else {
          console.log('Unable to find Knowledge linked to this record Id.');
          this.showToast('Error', 'An error has occurred. Please contact your Salesforce Administrator.', 'error');
        }
      })
      .catch(error => {
        auraExceptionHandler.logAuraException(error);
        this.showToast('Error', 'An error has occurred. Please contact your Salesforce Administrator.', 'error');
      });
  }

  showToast(title, message, variant) {
    const toastEvent = new ShowToastEvent({
      title, message, variant
    });
    this.dispatchEvent(toastEvent);
  }
}