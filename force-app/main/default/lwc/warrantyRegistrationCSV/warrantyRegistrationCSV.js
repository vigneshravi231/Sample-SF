

import { LightningElement, api } from "lwc";
import { Redux } from "c/lwcRedux";
import { sureThing } from "c/utils";
import { warranty as warrantyModule } from "c/reduxStore";

import uploadApex from "@salesforce/apex/WarrantyRegistrationFormController.uploadWarranties";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

const upload = sureThing(uploadApex);

import {ContextProvider} from "c/communityContextProvider";

export default class WarrantyRegistrationCSV extends ContextProvider(Redux(LightningElement)) {

    csvBase64;
    file;
    showSpinner;

    mapDispatchToProps() {
        return {
            addWarranties: warrantyModule.actions.addWarranty,
            addInvalidWarranties: warrantyModule.actions.addInvalidWarranty,
            setProductType: warrantyModule.actions.setProductType
        };
    }

    @api show(){
        this.template.querySelector('c-modal-dialog').show();
    }

    @api hide(){
        this.closeCSVModal();
    }

    closeCSVModal() {
        this.template.querySelector('c-modal-dialog').hide();
    }


    removeFile() {
        this.file = null;
        this.csvBase64 = null;
    }

    handleFileChange(event) {
        this.file = event.target.files[0];

        const reader = new FileReader();

        reader.onload = () => {
            this.csvBase64 = reader.result.split(",")[1];
            console.log("onload" + this.csvBase64);
        };

        reader.readAsDataURL(this.file);
    }

    async upload() {
        this.toggleSpinner();

        const params = {
            ctx: this.communityContext,
            csvBase64: this.csvBase64
        };
        const { ok, data, error } = await upload(params);

        if (ok) {
            const { invalid, valid } = data;

            this.props.addInvalidWarranties(invalid);
            this.props.addWarranties(valid.map(item => {
                return {
                    ...item,
                    record: {
                        ...item.record,
                        Mileage_at_Time_of_Sale__c: item.record?.Cycle_Count__c
                    }
                }
            }));
            const productTypesArr = valid.map(item => item.record?.ProductType__c?.match(/Seat|WAV|Lift/)?.[0]);
            if(productTypesArr.includes('WAV')) {
                this.props.setProductType('WAV');
            } else if(productTypesArr.length > 0) {
                this.props.setProductType(productTypesArr[0]);
            }
            this.toggleSpinner();

        } else {
            auraExceptionHandler.logAuraException(error);
            this.toggleSpinner();

            const toast = new ShowToastEvent({
                title: "CSV Upload Failed",
                message: error?.body?.message,
                variant: "error"
            });

            this.dispatchEvent(toast);
        }
        this.removeFile();
        this.closeCSVModal();
    }

    get hasFile() {
        return !!this.file;
    }

    get uploadDisabled() {
        return !this.file || !this.csvBase64;
    }

    toggleSpinner() {
        this.showSpinner = !this.showSpinner;
    }

}
