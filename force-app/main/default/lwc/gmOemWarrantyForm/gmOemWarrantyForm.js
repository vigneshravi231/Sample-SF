

import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import fetchRecordTypeId from "@salesforce/apex/GMOEMWarrantyStartFormController.getRecordTypeId";

export default class GMOEMWarrantyForm extends NavigationMixin(LightningElement) {

    recordTypeId;
    fields;
    isSoldByGM = false;

    success = false;
    isLoading = true;

    toastMessage = {
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
        },
        mileageError: () => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Vehicle Ineligible for this Warranty',
                message: 'Mileage needs to be less than 3000 to be eligible.',
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

        if(this.formIsValid()) {
            this.submitWarranty();
        }
    }

    submitWarranty() {
        this.fields.Subject = 'GM OEM Warranty Restart Form';
        this.template.querySelector('lightning-record-edit-form').submit(this.fields);
    }

    formIsValid() {
        if(this.fields.Vehicle_VIN__c.length !== 17) {
            this.toastMessage.vinError();
            this.isLoading = false;
            return false;
        } else if(this.fields.Vehicle_Mileage__c > 2999) {
            this.toastMessage.mileageError();
            this.isLoading = false;
            return false;
        }

        return true;
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

    handleInput(event) {
        this.isSoldByGM = event.target.checked;
    }
}