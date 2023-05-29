

import { LightningElement, track, wire } from "lwc";
import { CurrentPageReference, NavigationMixin } from "lightning/navigation";
import { MessageContext, publish } from "lightning/messageService";
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import initComponentData from "@salesforce/apex/SeatbaseConfiguratorController.initComponentData";
import addToCart from "@salesforce/apex/SeatbaseConfiguratorController.addToCart"
import fetchDynamicValuesForField from "@salesforce/apex/SeatbaseConfiguratorController.fetchDynamicValuesForField";
import fetchProducts from "@salesforce/apex/SeatbaseConfiguratorController.fetchProducts";

import {ContextProvider} from "c/communityContextProvider";

export default class SeatbaseConfigurator extends NavigationMixin(ContextProvider(LightningElement)) {

    @wire(MessageContext)
    messageContext;

    @wire(CurrentPageReference)
    pageReference;
    // holds picklists state for navigation
    pageState = "";

    isStateLoading = false;
    stateOptions = [];

    @track showSpinner = false;

    @track componentData = {};
    @track isInitialized = false;

    @track availableValues = {
        years: [],
        makes: [],
        models: [],
        converters: [],
        rampConversions: [],
        positions: [],
        controllers: [],
        transferHeights: [],
        seatOptions: []
    };
    @track availableProducts = [];
    @track showProductList = false;

    attributeChain = {
        year:           { hasNext: true, index: 0, next: "make",            nextFieldName: "Make__c",           nextAvailableValuesAttribute: "makes",              currentAvailableValuesAttribute: "years" },
        make:           { hasNext: true, index: 1, next: "model",           nextFieldName: "Model__c",          nextAvailableValuesAttribute: "models",             currentAvailableValuesAttribute: "makes" },
        model:          { hasNext: true, index: 2, next: "converter",       nextFieldName: "Converter__c",      nextAvailableValuesAttribute: "converters",         currentAvailableValuesAttribute: "models" },
        converter:      { hasNext: true, index: 3, next: "rampConversion",  nextFieldName: "RampConversion__c", nextAvailableValuesAttribute: "rampConversions",    currentAvailableValuesAttribute: "converters" },
        rampConversion: { hasNext: true, index: 4, next: "position",        nextFieldName: "Position__c",       nextAvailableValuesAttribute: "positions",          currentAvailableValuesAttribute: "rampConversions" },
        position:       { hasNext: true, index: 5, next: "controller",      nextFieldName: "Controller__c",     nextAvailableValuesAttribute: "controllers",        currentAvailableValuesAttribute: "positions" },
        controller:     { hasNext: true, index: 6, next: "transferHeight",  nextFieldName: "TransferHeight__c", nextAvailableValuesAttribute: "transferHeights",    currentAvailableValuesAttribute: "controllers" },
        transferHeight: { hasNext: true, index: 7, next: "seatOption",      nextFieldName: "SeatOption__c",     nextAvailableValuesAttribute: "seatOptions",        currentAvailableValuesAttribute: "transferHeights" },
        seatOption:     { hasNext: false, index: 8,                                                                                                                 currentAvailableValuesAttribute: "seatOptions" }
    };

    async connectedCallback() {
        if (this.pageReference && this.pageReference.state) {
            this.pageState = this.pageReference.state.seatbaseConfigState;
        }

        this.showSpinner = true;
        this.componentData = await initComponentData();
        this.componentData = JSON.parse(JSON.stringify(this.componentData));

        if (this.pageState) {
            await this.initPicklistValuesFromPageState();
        }

        this.availableValues.years = await fetchDynamicValuesForField({
            componentsDataBean: this.componentData,
            fieldName: 'Year__c'
        });

        this.showSpinner = false;
        this.isInitialized = true;
    }

    async handleAddToCart(event) {
        event.preventDefault();

        let seatbaseName = event.target.name;
        let filteredProducts = this.availableProducts.filter(function(value) {
            return value.name === seatbaseName;
        });
        let selectedProduct = filteredProducts[0];

        this.showSpinner = true;
        let isSuccess = await addToCart({
            ctx: this.communityContext,
            productInfo: selectedProduct,
        });
        this.showSpinner = false;

        if (isSuccess) {
            this.addToCartSuccessful(selectedProduct);
        } else {
            this.addToCartFailure(selectedProduct);
        }
    }

    addToCartSuccessful(selectedProduct) {
        const toast = new ShowToastEvent({
            title: 'Add To Cart',
            message: 'Successfully added Transfer Seat ' + selectedProduct.name + ' to cart',
            variant: 'success'
        });
        this.dispatchEvent(toast);

        publish(this.messageContext, cartChanged);
    }

    addToCartFailure(selectedProduct) {
        const toast = new ShowToastEvent({
            title: 'Add To Cart',
            message: 'Unexpected error occurred when trying to add\nTransfer Seat ' + selectedProduct.name + ' to cart',
            variant: 'error'
        });
        this.dispatchEvent(toast);

        publish(this.messageContext, cartChanged);
    }

    async handleValueChange(event) {
        await this.handleDynamicValueChange(event.target.name, event.detail.value);
    }

    async handleDynamicValueChange(currentAttribute, selectedValueParam) {
        let selectedValue = selectedValueParam;
        // if (this.isStateLoading) {
        //     let stateIndex = this.attributeChain[currentAttribute].index;
        //     let option = parseInt(this.stateOptions[stateIndex], 10);
        //     if (stateIndex !== 0) {
        //         let currentAvailableAttributeName = this.attributeChain[currentAttribute].currentAvailableValuesAttribute;
        //         selectedValue = this.availableValues[currentAvailableAttributeName][option].value;
        //     } else {
        //         selectedValue = this.vehicleTypes.data[option].value;
        //     }
        //
        //     //temp
        //     // this.isStateLoading = false;
        // }

        let nextAttribute = this.attributeChain[currentAttribute].next;
        let nextFieldName = this.attributeChain[currentAttribute].nextFieldName;
        let nextAvailableValuesAttribute = this.attributeChain[currentAttribute].nextAvailableValuesAttribute;

        if (!selectedValue) {
            this.clearAndDisableAfter(currentAttribute);
            return;
        }

        this.componentData[nextAttribute].isDisabled = false;
        this.componentData[nextAttribute].selectedValue = '';
        this.componentData[currentAttribute].selectedValue = selectedValue;

        this.showSpinner = true;
        let selectOptions = await fetchDynamicValuesForField({
            componentsDataBean: this.componentData,
            fieldName: nextFieldName
        });
        this.showSpinner = false;

        this.availableValues[nextAvailableValuesAttribute] = selectOptions;
        if (selectOptions.length === 2) {
            let assuredValue = selectOptions[1].value;
            if (this.attributeChain[nextAttribute].hasNext) {
                await this.handleDynamicValueChange(nextAttribute, assuredValue);
            } else {
                await this.handleDynamicLastFieldValueChange(assuredValue);
            }
        } else if (this.attributeChain[nextAttribute].hasNext) {
            this.clearAndDisableAfter(nextAttribute);
        }
    }

    async handleLastFieldValueChange(event) {
        await this.handleDynamicLastFieldValueChange(event.detail.value);
    }

    async handleDynamicLastFieldValueChange(selectedValue) {
        if (!selectedValue) {
            this.showSpinner = false;
            this.updateProductListDisplay([]);
            return;
        }
        this.componentData.seatOption.selectedValue = selectedValue;

        this.showSpinner = true;
        let productInfos = await fetchProducts({
            ctx: this.communityContext,
            componentsDataBean: this.componentData
        });
        this.showSpinner = false;

        this.updateProductListDisplay(productInfos);
    }

    clearAndDisableAfter(attributeName) {
        let afterAttribute = this.attributeChain[attributeName].next;

        this.componentData[afterAttribute].selectedValue = "";
        this.componentData[afterAttribute].isDisabled = true;

        if (this.attributeChain[afterAttribute].hasNext) {
            this.clearAndDisableAfter(afterAttribute);
        } else {
            this.updateProductListDisplay([]);
        }
    }

    updateProductListDisplay(availableProducts) {
        this.availableProducts = JSON.parse(JSON.stringify(availableProducts));
        this.showProductList = this.availableProducts.length > 0;
    }

    gotoProductDetailPage(event){
        event.preventDefault();

        let product = event.target.value;

        this.calculatePageState();

        this[NavigationMixin.Navigate]({
            type: "standard__recordPage",
            attributes: {
                recordId: product.sfid,
                objectApiName: "Product2",
                actionName: "view",
            },
            state: {
                seatbaseConfigState: this.pageState
            }
        });
    }

    calculatePageState() {
        let isCorrectOption = function(selectedOption) {
            return selectedOption.value === this;
        }
        let optionsString = "";
        // TODO calculate optionsString

        this.pageState = window.btoa(optionsString);
    }

    async initPicklistValuesFromPageState() {
        let optionsString = window.atob(this.pageState);
        this.stateOptions = optionsString.split(' ');

        // this.isStateLoading = true;
        await this.handleDynamicValueChange('year', null);
    }

    calculateOptionState(availableValueAttribute, componentDataAttribute, compareFunction) {
        return " " + this.availableValues[availableValueAttribute]
            .findIndex(compareFunction, this.componentData[componentDataAttribute].selectedValue);
    }
}
