

import { LightningElement } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import fetchRecordTypeId from "@salesforce/apex/ChryslerOEMWarrantyFormController.getRecordTypeId";
import { auraExceptionHandler } from "c/auraExceptionHandler";

export default class ChryslerOEMWarrantyForm extends NavigationMixin(LightningElement){

    recordTypeId;
    fields;

    success = false;
    isLoading = true;

    toastMessage =  {
        loadError: () => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'An error has occurred',
                message: 'Please contact your Salesforce administrator.',
                variant: 'error'
            }));
        },
        vinError: () => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Invalid Form Submission',
                message: 'VIN must be exactly 17 characters long.',
                variant: 'error'
            }));
        }
    }

    connectedCallback() {
        fetchRecordTypeId()
          .then(result => {
              console.log(result, 'record type id');
              this.recordTypeId = result;
          })
          .catch(error => {
              auraExceptionHandler.logAuraException(error);
          });
    }

    newForm() {
        this.success = false;
        this.isLoading = true;
    }

    onLoad() {
        this.isLoading = false;
    }

    onSuccess() {
        this.success = true;
        this.isLoading = false;
    }

    onError() {
        this.isLoading = false;
        this.toastMessage.loadError();
    }

    onSubmit(event) {
        event.preventDefault();
        this.fields = event.detail.fields;

        this.isLoading = true;

        if(this.formIsValid()){
            this.submitWarranty();
        }
    }

    submitWarranty() {
        this.fields.Subject = 'Chrysler OEM Warranty Form';
        this.template.querySelector('lightning-record-edit-form').submit(this.fields);
    }

    formIsValid() {
        let isValid = this.fields.Vehicle_VIN__c.length === 17;

        if(!isValid) {
            console.log('not valid');
            this.isLoading = false;
            this.toastMessage.vinError();
        }

        return isValid;
    }

    navigateToOpenCases() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Case',
                actionName: 'list'
            },
            state: {
                'Case-filterId': 'My_Open_cases'
            }
        });
    }

}