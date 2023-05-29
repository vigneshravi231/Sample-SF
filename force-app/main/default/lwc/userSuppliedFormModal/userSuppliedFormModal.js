


import { api, LightningElement, track } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import fetchPreloadedInformation from "@salesforce/apex/WavListViewController.fetchPreloadedInformation";
import fetchShipToAddressByAccountId from "@salesforce/apex/WavListViewController.fetchShipToAddressByAccountId";

const PRODUCT_CONFIG_TO_CASE_FIELD_MAPPING = {
  "Product__r.Chassis_Type__c": "Chassis_Type_DL__c",
  "Conversion_Type__c": "Conversion_Type_DL__c",
  "Product__r.Year__c": "Chassis_Year__c",
  "Product__r.Make__c": "Vehicle_Make__c",
  "Product__r.Model__c": "Vehicle_Model__c"
};

const CONFIGURATION_META = [
  {
    section: 1,
    label: 'Vehicle',
    fields: [
      {
        name: "Product__r.Year__c",
        label: "Year",
        dependsOn: [],
        excludeOptions: [
          String(new Date().getFullYear() - 1),
          String(new Date().getFullYear() - 2),
          String(new Date().getFullYear() - 3),
          String(new Date().getFullYear() - 4),
          String(new Date().getFullYear() - 5),
          String(new Date().getFullYear() - 6),
          String(new Date().getFullYear() - 7),
          String(new Date().getFullYear() - 8),
          String(new Date().getFullYear() - 9),
          String(new Date().getFullYear() - 10)
        ]
      },
      {
        name: "Product__r.Make__c",
        label: "Make",
        dependsOn: [],
      },
      {
        name: "Product__r.Model__c",
        label: "Model",
        dependsOn: [],
      },
    ]
  }
];

export default class UserSuppliedFormModal extends LightningElement {
  @api showModal;
  @api fullVin;
  @api flooring;
  @api seating;
  @api conversion;
  @api isDealerLocate;

  @track submittingCase = false;
  @track accountOptions = [];
  @track shippingAddresses = [];
  shippingAddressMap = {};
  preloadedData = {};
  @track selectedAccountId;
  selectedAccountNumber;
  selectedShippingAddress;
  selectedProduct;
  selectedTerms;
  @track customerSuppliedRecordType;
  @track dealerLocateRecordType;
  @track SamplePickup = false;

  @api configuration = CONFIGURATION_META;
  @track configuredProduct = {};

  connectedCallback() {
    fetchPreloadedInformation()
      .then(result => {
        console.log(result, 'preload5');
        this.preloadedData = result;
        this.accountOptions = result.accounts.map(item => {
          return {
            label: item.AccountNumber,
            value: item.Id,
          };
        });
        this.selectedAccountNumber = this.accountOptions?.[0]?.label;
        this.selectedAccountId = this.accountOptions?.[0]?.value;
        this.customerSuppliedRecordType = result.customerSuppliedRecordType;
        this.dealerLocateRecordType = result.dealerLocateRecordType;
      })
      .catch(error => auraExceptionHandler.logAuraException(error))
      .then(() => {
        if(this.accountOptions.length > 0 && !this.isDealerLocate) {
          fetchShipToAddressByAccountId({ accountId: this.accountOptions[0].value })
            .then(result => {
              this.shippingAddresses = result.map(item => {
                this.shippingAddressMap[item.Id] = item;
                return {
                  label: `${item.Street} ${item.City}, ${item.State} ${item.PostalCode} ${item.Country}`,
                  value: item.Id,
                };
              });
            })
            .catch(error => auraExceptionHandler.logAuraException(error));
        }
      });
  }

  handleConfigChange(event){
    this.configuredProduct = event.detail;
  }

  get noShippingAddresses() {
    return this.shippingAddresses.length === 0;
  }

  get hasOneAccount() {
    return this.accountOptions.length === 1;
  }

  onAccountNumberChange(event) {
    this.selectedAccountNumber = event.detail.label;
    this.selectedAccountId = event.detail.value;

    if(!this.isDealerLocate) {
      fetchShipToAddressByAccountId({ accountId: event.detail.value })
        .then(result => {
          this.shippingAddresses = result.map(item => {
            this.shippingAddressMap[item.Id] = item;
            return {
              label: `${item.Street} ${item.City}, ${item.State} ${item.PostalCode} ${item.Country}`,
              value: item.Id,
            };
          });
        })
        .catch(error => auraExceptionHandler.logAuraException(error));
    }
  }

  onShippingAddressChange(event) {
    this.selectedShippingAddress = this.shippingAddressMap[event.detail.value];
  }

  onCaseSubmit(event) {
    event.preventDefault();
    this.submittingCase = true;
    const fields = event.detail.fields;
    fields.AccountId = this.selectedAccountId;
    fields.Dealer_Name__c = this.selectedAccountId;
    fields.AccountNumber__c = this.selectedAccountNumber;

    if(this.isDealerLocate) {
      // populate configured product fields
      Object.keys(this.configuredProduct).forEach(field => {
        if(!!this.configuredProduct[field] && !!PRODUCT_CONFIG_TO_CASE_FIELD_MAPPING[field]){
          const value =  this.configuredProduct[field];
          const caseField  = PRODUCT_CONFIG_TO_CASE_FIELD_MAPPING[field];

          fields[caseField] = value;
        }
      });

      fields.RecordTypeId = this.dealerLocateRecordType;
      fields.Subject = 'Dealer Locate Case';
    } else {
      fields.Selling_Dealer_Name__c = this.preloadedData.dealerRepName;
      fields.Selling_Dealer_Email__c = this.preloadedData.dealerRepEmail;
      fields.Shipping_Street__c = this.selectedShippingAddress?.Street;
      fields.Shipping_City__c = this.selectedShippingAddress?.City;
      fields.Shipping_State__c = this.selectedShippingAddress?.State;
      fields.Shipping_Postal_Code__c = this.selectedShippingAddress?.PostalCode;
      fields.Shipping_Country__c = this.selectedShippingAddress?.Country;
      fields.Type = this.selectedProduct ? "Used Unconverted Request" : "Customer Supplied";
      fields.RecordTypeId = this.customerSuppliedRecordType;
      fields.Subject = 'Customer Supplied Case';
    }

    fields.Origin = "Web";

    console.log(JSON.parse(JSON.stringify(fields)), 'fields');
    this.template.querySelector("lightning-record-edit-form").submit(fields);
  }

  onSuccess() {
    this.dispatchEvent(new ShowToastEvent({
      title: 'Case successfully submitted!',
      message: 'You will receive a confirmation email shortly.',
      variant: 'success'
    }));
    this.submittingCase = false;
    this.closeCaseModal();
  }

  onError(event) {
    console.log('Error: ', JSON.parse(JSON.stringify(event.detail)));
    this.dispatchEvent(new ShowToastEvent({
      title: 'An error has occurred.',
      message: 'Your Salesforce admin has been notified.',
      variant: 'error'
    }));
    this.submittingCase = false;
  }

  closeCaseModal() {
    let details = { showModal: false, bubbles: true, composed: true };
    const toggleModal = new CustomEvent("closemodal", { detail: details, bubbles: true, composed: true });
    this.dispatchEvent(toggleModal);
  }

  onChangeSamplePickup() {
    this.SamplePickup = !this.SamplePickup;
  }
}
