


import { LightningElement, api } from "lwc";
import {  getRecordNotifyChange } from 'lightning/uiRecordApi';
import getAccountSetupConfig from '@salesforce/apex/BuyerAccountConfiguratorController.getAccountSetupConfig';
import { auraExceptionHandler } from "c/auraExceptionHandler";

export default class ConfigureB2BAccount extends LightningElement {
  @api recordId;
  loading;
  serverError;
  portalAccessFields = [];
  showModal;
  fields = [
    'Account.IsBuyer',
    'Account.ShippingStreet',
    'Account.ShippingCity',
    'Account.ShippingState',
    'Account.ShippingPostalCode',
    'Account.ShippingCountry',
    'Account.BillingStreet',
    'Account.BillingCity',
    'Account.BillingState',
    'Account.BillingPostalCode',
    'Account.BillingCountry',
    'Account.acCore__PaymentTerm__c',
    'Account.Price_Book__c',
    'Account.Name'
  ];

  connectedCallback() {
    this.getAccountSetupData();
  }

  getAccountSetupData() {
    this.loading = true;
    getAccountSetupConfig()
      .then((res) => {
        this.loading = false;
        this.processPortalAccessFields(res.Standard_Buyer_Groups__c);
        // console.log('SUCCESS: ' , res);
      })
      .catch((error) => {
        this.loading = false;
        this.serverError = true;
        this.disableButton();
        auraExceptionHandler.logAuraException(error);
      });
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  processPortalAccessFields(portalAccessFieldsString) {
    this.portalAccessFields = portalAccessFieldsString.split(',').map(field => `${field}__c`);
    this.fields.push(...this.portalAccessFields.map(field => `Account.${field}`));
  }

  save() {
    this.template
      .querySelector("c-buyer-account-configurator")
      .saveAccount();
  }

  handleConfigSuccess(event) {
    this.closeModal();
    getRecordNotifyChange([{recordId: this.recordId}]);
  }

  disableButton() {
    this.template.querySelector('button').disabled = true;
  }

}