

import { LightningElement, api } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import insertWarrantyRegistrationList from "@salesforce/apex/WarrantyRegistrationFormController.insertWarrantyRegistrationList";
import downloadPdfs from "@salesforce/apex/WarrantyRegistrationFormController.downloadPdfs";
import viewPdfs from "@salesforce/apex/WarrantyRegistrationFormController.viewPdfs";

//Redux methods for store
import { createStore, combineReducers, Redux } from "c/lwcRedux";
import reducers from "c/reduxStore";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import {ContextProvider} from "c/communityContextProvider";

export default class WarrantyRegistrationForm extends NavigationMixin(ContextProvider(Redux(LightningElement))) {

    @api store;
    submitted;
    submitting;
    showSpinner;
    submittedEntitlements;
    submittedEntitlementIdList;
    alreadyRegistered = false;

    initialize() {
        const logger = (store) => (next) => (action) => {

            const deproxy = (o) => {
                try {
                    return JSON.parse(JSON.stringify(o));
                } catch (e) {
                    return o;
                }
            };

            console.group(action.type);
            const oldState = store.getState();
            console.log("current state", deproxy(oldState));
            console.info(`dispatching`, deproxy(action));

            let result = next(action);
            const newState = store.getState();

            console.log("next state", deproxy(newState));
            console.groupEnd();

            return result;
        };
        const combineReducersInstance = combineReducers(reducers);
        this.store = createStore(combineReducersInstance, logger);
    }

    mapStateToProps(state) {
        return {
            warranties: state.warranty.warranties,
            checklist: state.warranty.checklist
        };
    }

    //Fired by child modal in checklist component
    handleWarrantySubmit() {
        let data = this.joinDataSets();
        this.insertWarrantyRegistrationList(data);
    }

    joinDataSets() {
        let state = this.store.getState().warranty;
        const entitlementList = [];
        state.warranties.forEach((asset) => {
            entitlementList.push({...asset.record, ...state.checklist});
        });
        return entitlementList;
    }

    insertWarrantyRegistrationList(entitlementList) {
        //Final submission
        this.showSpinner = true;
        this.submitting = true;
        insertWarrantyRegistrationList({
            ctx: this.communityContext,
            entitlementList: entitlementList
        })
        .then((result) => {
            this.submitted = true;
            this.showSpinner = false;
            //Get entitlements and Ids, so we can show pdf buttons for read or download
            console.log(result);
            this.submittedEntitlements = result;
            this.submittedEntitlementIdList = this.extractSubmittedEntitlementIds();
        })
        .catch((error) => {
            auraExceptionHandler.logAuraException(error);
            this.showSpinner = false;
            let errorMessage = 'There was an issue with your warranty registration, please contact your administrator'

            let errorObj = null;
            if(error.body?.message) {
                errorObj = JSON.parse(error.body.message);
            }
            if(errorObj && /has already registered warranty./.test(errorObj.serverMessage)) {
                this.alreadyRegistered = true;
                errorMessage = 'Asset already has a warranty registration.';
            }

            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: errorMessage,
                variant: 'error',
                mode: 'dismissable'
            }))
        });
    }

    downloadPdfs() {
        this.showSpinner = true;
        downloadPdfs({ entitlementIdList: this.submittedEntitlementIdList })
        .then((result) => {
            this.showSpinner = false;
            this[NavigationMixin.Navigate]({
                type: "standard__webPage",
                attributes: {
                    url: result
                }
            });
        })
        .catch((error) => {
            auraExceptionHandler.logAuraException(error);
        });
    }

    // viewPdfs() {
    //     viewPdfs({ entitlementIdList: this.submittedEntitlementIdList })
    //     .then((result) => {
    //         this.showSpinner = false;
    //     })
    //     .catch((error) => {
    //         auraExceptionHandler.logAuraException(error);
    //     });
    // }

    extractSubmittedEntitlementIds() {
        let idList = [];
        this.submittedEntitlements.forEach((entitlement) => {
            idList.push(entitlement.Id);
        });
        return idList;
    }

    reload() {
        window.location.reload();
    }

}
