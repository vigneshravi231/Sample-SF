

import { LightningElement, api, track } from "lwc";
import {Redux} from "c/lwcRedux";
import {warranty} from "c/reduxStore";

export default class WarrantyRegistrationChecklist extends Redux(LightningElement) {

    @track errorList = [];

    showSubmitModal;
    checkToggleAllState = true;

    mapDispatchToProps(){
        return {
           submitChecklist: warranty.actions.submitChecklist,
        }
    }

    mapStateToProps(state){
        console.log(state.warranty.productType, 'productType');
        return {
            warranties: state.warranty.warranties,
            invalidWarranties: state.warranty.invalidWarranties,
            productType: state.warranty.productType
        }
    }

    get isChecklistRequired() {
        return this.props.productType === 'WAV'
    }

    constructor() {
        super();
    }

    onSubmit(event){
        event.preventDefault();
        if(this.registrationIsValid()) {
            this.showSubmitModal = true;
            this.props.submitChecklist(event.detail.fields);
        }
    }

    closeSubmitModal(){
        this.showSubmitModal = false;
    }

    handleModalToggle(){
        this.showSubmitModal = false;
    }

    toggleCheckAll() {
        let itemList = this.getCheckListItems();

        itemList.forEach((item) => {
            item.value = this.checkToggleAllState;
        });

        this.checkToggleAllState = !this.checkToggleAllState;
    }

    requiredCheckboxesChecked() {
        let itemList = this.getCheckListItems();
        let allItemsValid = true;

        itemList.forEach((item) => {
            if(item.value === false) {
                allItemsValid = false;
            }
        });

        return !allItemsValid;
    }

    getCheckListItems() {
        return this.template.querySelectorAll("[data-id=checklistitem]");
    }

    submitWarrantyRegistration(event) {
        event.stopPropagation();
        event.preventDefault();
        //Handle in top most parent, grab checklist and asset table from state props
        this.dispatchEvent(new CustomEvent('submitwarrantyregistration'));
    }

    registrationIsValid() {
        this.errorList = [];

        if(this.props.warranties.length === 0){
            this.errorList.push('At least one asset needs to be attached to submit.');
        }

        if(this.props.invalidWarranties.length !== 0){
            this.errorList.push('Error lines from CSV upload are present and need to be resolved.');
        }

        if(this.requiredCheckboxesChecked() && this.productType === 'WAV'){
            this.errorList.push('Check all vehicle delivery checkboxes before proceeding.');
        }

        return this.errorList.length === 0;
    }

    @track
    showDependentFieldState = {
        Is_Servicing_Dealer__c: false,
    }

    handleShowDependentField(event) {
        //Dependent fields are mapped by data attribute controllingfieldapiname
        let controllingFieldApiName = event.currentTarget.dataset.controllingfieldapiname;
        let value = event.currentTarget.value;
        let result;

        switch(controllingFieldApiName) {
            case 'Is_Servicing_Dealer__c':
                result = !this.showDependentFieldState[controllingFieldApiName];
                break;
            default:
                result = !this.showDependentFieldState[controllingFieldApiName];
        }

        this.showDependentFieldState[controllingFieldApiName] = result;
    }

}
