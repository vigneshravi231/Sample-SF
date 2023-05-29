

import { LightningElement, wire, track } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from "lightning/messageService";
import { NavigationMixin, CurrentPageReference } from "lightning/navigation";
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";

import initComponentData from "@salesforce/apex/LiftConfiguratorController.initComponentData";
import fetchDynamicValuesForField from "@salesforce/apex/LiftConfiguratorController.fetchDynamicValuesForField";
import fetchVehicleTypes from "@salesforce/apex/LiftConfiguratorController.fetchVehicleTypes";
import fetchProducts from "@salesforce/apex/LiftConfiguratorController.fetchProducts";
import addToCart from "@salesforce/apex/LiftConfiguratorController.addToCart";

import { ContextProvider } from "c/communityContextProvider";

export default class LiftConfigurator extends NavigationMixin(ContextProvider(LightningElement)) {

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

    @wire(fetchVehicleTypes) vehicleTypes;
    @track availableValues = {
        makes: [],
        years: [],
        models: [],
        entryTypes: [],
        doorTypes: [],
        airbagOptions: [],
        vehicleLengths: [],
        doorWidths: [],
        doorHeights: [],
        liftCapacities: [],
        occupantTypes: []
    };
    @track availableProducts = [];
    @track showProductList = false;

    attributeChain = {
        vehicleType:    { hasNext: true, index: 0, next: "make", nextFieldName: "Make__c", nextAvailableValuesAttribute: "makes" },
        make:           { hasNext: true, index: 1, next: "year", nextFieldName: "Year__c", nextAvailableValuesAttribute: "years", currentAvailableValuesAttribute: "makes" },
        year:           { hasNext: true, index: 2, next: "model", nextFieldName: "Model__c", nextAvailableValuesAttribute: "models", currentAvailableValuesAttribute: "years" },
        model:          { hasNext: true, index: 3, next: "entryType", nextFieldName: "Entry_Type__c", nextAvailableValuesAttribute: "entryTypes", currentAvailableValuesAttribute: "models" },
        entryType:      { hasNext: true, index: 4, next: "doorType", nextFieldName: "Door_Type__c", nextAvailableValuesAttribute: "doorTypes", currentAvailableValuesAttribute: "entryTypes" },
        doorType:       { hasNext: true, index: 5, next: "airbagOption", nextFieldName: "Airbag_Option__c", nextAvailableValuesAttribute: "airbagOptions", currentAvailableValuesAttribute: "doorTypes" },
        airbagOption:   { hasNext: true, index: 6, next: "vehicleLength", nextFieldName: "Vehicle_Length__c", nextAvailableValuesAttribute: "vehicleLengths", currentAvailableValuesAttribute: "airbagOptions" },
        vehicleLength:  { hasNext: true, index: 7, next: "doorWidth", nextFieldName: "Door_Width__c", nextAvailableValuesAttribute: "doorWidths", currentAvailableValuesAttribute: "vehicleLengths" },
        doorWidth:      { hasNext: true, index: 8, next: "doorHeight", nextFieldName: "Door_Height__c", nextAvailableValuesAttribute: "doorHeights", currentAvailableValuesAttribute: "doorWidths" },
        doorHeight:     { hasNext: true, index: 9, next: "liftCapacity", nextFieldName: "Lift_Capacity__c", nextAvailableValuesAttribute: "liftCapacities", currentAvailableValuesAttribute: "doorHeights" },
        liftCapacity:   { hasNext: true, index: 10, next: "occupantType", nextFieldName: "Occupant_Type__c", nextAvailableValuesAttribute: "occupantTypes", currentAvailableValuesAttribute: "liftCapacities" },
        occupantType:   { hasNext: false, index: 11, currentAvailableValuesAttribute: "occupantTypes" }
    };

    @wire(initComponentData)
    initComponentData({ error, data }) {

        console.log(JSON.stringify(this.pageReference));
        if (this.pageReference && this.pageReference.state) {
            this.pageState = this.pageReference.state.liftConfigState;
        }

        if (data) {
            this.componentData = JSON.parse(JSON.stringify(data));
            this.isInitialized = true;
            if (this.pageState) {
                this.initPicklistValuesFromPageState();
            }
        } else if (error) {
            console.log(error);
        }
    }

    handleAddToCart(event) {
        event.preventDefault();

        let liftName = event.target.name;
        let filteredProducts = this.availableProducts.filter(function(value) {
            return value.name === liftName;
        });
        let selectedProduct = filteredProducts[0];

        console.log(selectedProduct);

        this.showSpinner = true;

        addToCart({
            ctx: this.communityContext,
            productInfo: selectedProduct
        })
            .then(result => {
                console.log(result);

                this.showSpinner = false;
                this.addToCartSuccessful(selectedProduct);
            })
            .catch(error => {
                this.showSpinner = false;
                auraExceptionHandler.logAuraException(error);
            });
    }

    addToCartSuccessful(selectedProduct) {
        const toast = new ShowToastEvent({
            title: "Add To Cart",
            message: `Successfully added Lift ${selectedProduct.name} to cart`,
            variant: "success"
        });
        this.dispatchEvent(toast);

        publish(this.messageContext, cartChanged);
    }

    urlHistoryReplaceState(state){
        const pageRef = Object.assign({}, this.pageReference, {
            state: Object.assign({}, this.pageReference.state, state)
        });

        this[NavigationMixin.Navigate](pageRef);
    }

    handleValueChange(event) {
        this.handleDynamicValueChange(event.target.name, event.detail.value);
    }

    handleDynamicValueChange(currentAttribute, selectedValueParam) {
        let selectedValue = selectedValueParam;
        if (this.isStateLoading) {
            let stateIndex = this.attributeChain[currentAttribute].index;
            let option = parseInt(this.stateOptions[stateIndex], 10);
            if (stateIndex !== 0) {
                let currentAvailableAttributeName = this.attributeChain[currentAttribute].currentAvailableValuesAttribute;
                selectedValue = this.availableValues[currentAvailableAttributeName][option].value;
            } else {
                selectedValue = this.vehicleTypes.data[option].value;
            }

            //temp
            // this.isStateLoading = false;
        }

        let nextAttribute = this.attributeChain[currentAttribute].next;
        let nextFieldName = this.attributeChain[currentAttribute].nextFieldName;
        let nextAvailableValuesAttribute = this.attributeChain[currentAttribute].nextAvailableValuesAttribute;

        if (!selectedValue) {
            this.clearAndDisableAfter(currentAttribute);
            return;
        }

        this.componentData[currentAttribute].selectedValue = selectedValue;
        this.componentData[nextAttribute].isDisabled = false;
        this.componentData[nextAttribute].selectedValue = "";

        this.showSpinner = true;
        fetchDynamicValuesForField({
            ctx: this.communityContext,
            componentsDataBean: this.componentData,
            fieldName: nextFieldName
        })
            .then(result => {
                this.availableValues[nextAvailableValuesAttribute] = result;

                if (result.length === 2 || this.isStateLoading) {
                    let assuredValue = result[1].value;
                    if (this.attributeChain[nextAttribute].hasNext) {
                        this.handleDynamicValueChange(nextAttribute, assuredValue);
                    } else {
                        this.handleDynamicOccupantTypeChange(assuredValue);
                    }
                } else {
                    this.showSpinner = false;
                }
            })
            .catch(error => {
                this.showSpinner = false;
                auraExceptionHandler.logAuraException(error);
            });

        if (this.attributeChain[nextAttribute].hasNext) {
            this.clearAndDisableAfter(nextAttribute);
        }
    }

    handleOccupantTypeChange(event) {
        this.handleDynamicOccupantTypeChange(event.detail.value);
    }

    handleDynamicOccupantTypeChange(selectedValue) {
        this.isStateLoading = false;

        if (!selectedValue) {
            this.showSpinner = false;
            this.updateProductListDisplay([]);
            return;
        }
        this.componentData.occupantType.selectedValue = selectedValue;

        fetchProducts({
            componentsDataBean: this.componentData
        })
            .then(result => {
                this.showSpinner = false;
                this.updateProductListDisplay(result);
            })
            .catch(error => {
                this.showSpinner = false;
                auraExceptionHandler.logAuraException(error);
            });
    }

    handleKitSelection(event) {
        let isChecked = event.target.checked;
        let productName = event.target.dataset.id;

        this.availableProducts.forEach(function(product) {
            if (product.name === productName) {
                if (isChecked) {
                    product.price += product.additionalKit.price;
                } else {
                    product.price -= product.additionalKit.price;
                }
                product.isKitSelected = isChecked;
            }
        });
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
        this.urlHistoryReplaceState({liftConfigState: this.pageState})

        this[NavigationMixin.Navigate]({
            type: "standard__recordPage",
            attributes: {
                recordId: product.sfid,
                objectApiName: "Product2",
                actionName: "view",
            },
            state: {
                liftConfigState: this.pageState
            }
        });
    }

    calculatePageState() {
        let isCorrectOption = function(selectedOption) {
            return selectedOption.value === this;
        }
        let optionsString = ""
            + this.vehicleTypes.data.findIndex(isCorrectOption, this.componentData.vehicleType.selectedValue)
            + this.calculateOptionState("makes", "make", isCorrectOption)
            + this.calculateOptionState("years", "year", isCorrectOption)
            + this.calculateOptionState("models", "model", isCorrectOption)
            + this.calculateOptionState("entryTypes", "entryType", isCorrectOption)
            + this.calculateOptionState("doorTypes", "doorType", isCorrectOption)
            + this.calculateOptionState("airbagOptions", "airbagOption", isCorrectOption)
            + this.calculateOptionState("vehicleLengths", "vehicleLength", isCorrectOption)
            + this.calculateOptionState("doorWidths", "doorWidth", isCorrectOption)
            + this.calculateOptionState("doorHeights", "doorHeight", isCorrectOption)
            + this.calculateOptionState("liftCapacities", "liftCapacity", isCorrectOption)
            + this.calculateOptionState("occupantTypes", "occupantType", isCorrectOption);

        this.pageState = window.btoa(optionsString);
    }

    initPicklistValuesFromPageState() {
        let optionsString = window.atob(this.pageState);
        this.stateOptions = optionsString.split(' ');

        this.isStateLoading = true;
        this.handleDynamicValueChange('vehicleType', null);
    }

    calculateOptionState(availableValueAttribute, componentDataAttribute, compareFunction) {
        return " " + this.availableValues[availableValueAttribute]
            .findIndex(compareFunction, this.componentData[componentDataAttribute].selectedValue);
    }
}
