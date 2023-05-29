


import { LightningElement, api, wire } from "lwc";
import { getRecord } from 'lightning/uiRecordApi';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deepClone, logProxy } from "c/utils";
import configureBuyerAccount from '@salesforce/apex/BuyerAccountConfiguratorController.configureBuyerAccount';
import { auraExceptionHandler } from "c/auraExceptionHandler";

export default class BuyerAccountConfigurator extends LightningElement {

  @api recordId;
  @api fields;
  @api portalAccessFields;
  portalAccessFieldsCol1;
  portalAccessFieldsCol2
  loading = true;
  wireSuccess;
  accountData;
  account = {};
  buyerEnabled;
  disableForm;

  _country = 'US';

  states = [
    { 'value' : "AL", 'label' : "Alabama" },
    { 'value' : "AK", 'label' : "Alaska" },
    { 'value' : "AZ", 'label' : "Arizona" },
    { 'value' : "AR", 'label' : "Arkansas" },
    { 'value' : "CA", 'label' : "California" },
    { 'value' : "CO", 'label' : "Colorado" },
    { 'value' : "CT", 'label' : "Connecticut" },
    { 'value' : "DE", 'label' : "Delaware" },
    { 'value' : "DC", 'label' : "District Of Columbia" },
    { 'value' : "FL", 'label' : "Florida" },
    { 'value' : "GA", 'label' : "Georgia" },
    { 'value' : "HI", 'label' : "Hawaii" },
    { 'value' : "ID", 'label' : "Idaho" },
    { 'value' : "IL", 'label' : "Illinois" },
    { 'value' : "IN", 'label' : "Indiana" },
    { 'value' : "IA", 'label' : "Iowa" },
    { 'value' : "KS", 'label' : "Kansas" },
    { 'value' : "KY", 'label' : "Kentucky" },
    { 'value' : "LA", 'label' : "Louisiana" },
    { 'value' : "ME", 'label' : "Maine" },
    { 'value' : "MD", 'label' : "Maryland" },
    { 'value' : "MA", 'label' : "Massachusetts" },
    { 'value' : "MI", 'label' : "Michigan" },
    { 'value' : "MN", 'label' : "Minnesota" },
    { 'value' : "MS", 'label' : "Mississippi" },
    { 'value' : "MO", 'label' : "Missouri" },
    { 'value' : "MT", 'label' : "Montana" },
    { 'value' : "NE", 'label' : "Nebraska" },
    { 'value' : "NV", 'label' : "Nevada" },
    { 'value' : "NH", 'label' : "New Hampshire" },
    { 'value' : "NJ", 'label' : "New Jersey" },
    { 'value' : "NM", 'label' : "New Mexico" },
    { 'value' : "NY", 'label' : "New York" },
    { 'value' : "NC", 'label' : "North Carolina" },
    { 'value' : "ND", 'label' : "North Dakota" },
    { 'value' : "OH", 'label' : "Ohio" },
    { 'value' : "OK", 'label' : "Oklahoma" },
    { 'value' : "OR", 'label' : "Oregon" },
    { 'value' : "PA", 'label' : "Pennsylvania" },
    { 'value' : "PR", 'label' : "Puerto Rico" },
    { 'value' : "RI", 'label' : "Rhode Island" },
    { 'value' : "SC", 'label' : "South Carolina" },
    { 'value' : "SD", 'label' : "South Dakota" },
    { 'value' : "TN", 'label' : "Tennessee" },
    { 'value' : "TX", 'label' : "Texas" },
    { 'value' : "UT", 'label' : "Utah" },
    { 'value' : "VT", 'label' : "Vermont" },
    { 'value' : "VI", 'label' : "Virgin Islands" },
    { 'value' : "VA", 'label' : "Virginia" },
    { 'value' : "WA", 'label' : "Washington" },
    { 'value' : "WV", 'label' : "West Virginia" },
    { 'value' : "WI", 'label' : "Wisconsin" },
    { 'value' : "WY", 'label' : "Wyoming" }
  ]

  countryProvinceMap = {
    US: this.states,
  };

  countryOptions = [
    { label: 'United States', value: 'US' },
  ];

  @wire(getRecord, { recordId: '$recordId', fields: '$fields' })
  wiredRecord({ error, data }) {
    if(data) {
      this.handleWireServiceSuccess(data);
    } else if(error){
      this.handleWireServiceError(error);
    }
  }

  connectedCallback() {
    this.createPortalAccessCols();
  }

  get getProvinceOptions() {
    return this.countryProvinceMap[this._country];
  }

  get getCountryOptions() {
    return this.countryOptions;
  }

  @api saveAccount() {
    this.loading = true;
    logProxy('ACCOUNT: ', this.account);
    configureBuyerAccount({ buyerAccount: this.account })
      .then((result) => {
        this.loading = false;
        console.log('SUCCESS: ' , result);
        this.showToast('Success', 'Successfully updated Buyer Account', 'success');
        this.fireSuccessEvent();
      })
      .catch((error) => {
        this.loading = false;
        this.showToast('Error', 'An unexpected error occurred, please try again or contact Administrator', 'error')
        auraExceptionHandler.logAuraException(error);
      });
  }

  handleWireServiceSuccess(data) {
    this.loading = false;
    this.wireSuccess = true;
    this.accountData = data;
    this.buyerEnabled = this.getWireValue(data, 'IsBuyer')
    this.populateAccountObj();
  }

  handleWireServiceError(error) {
    console.log('Wire Service Get Record Error: ', error)
    this.loading = false;
    this.wireSuccess = false;
    this.showToast('error', 'Error retrieving Account data', 'error')
  }

  populateAccountObj() {
    Object.keys(this.accountData.fields).forEach(field => {
      this.account[field] = this.accountData.fields[field].value;
    });
    this.account.Id = this.recordId;
  }

  createPortalAccessCols() {
    let fields = deepClone(this.portalAccessFields);
    let half_length = Math.ceil(fields.length / 2);

    this.portalAccessFieldsCol1 = fields;
    this.portalAccessFieldsCol2 = fields.splice(0,half_length);
  }

  getWireValue(record, fieldName) {
    return record.fields[fieldName].value;
  }

  enableBuyer(event) {
    this.buyerEnabled = event.target.checked;
    this.account.IsBuyer = event.target.checked;
    this.disableForm = !this.buyerEnabled;
  }

  handleFieldUpdate(event) {
    console.log('event: ', event.currentTarget.dataset);
    let fieldName = event.currentTarget.dataset.fieldName;
    console.log('field name ', fieldName);
    if(this.account.hasOwnProperty(fieldName)) {
      this.account[fieldName] = event.target.value;
    }
  }

  fireSuccessEvent() {
    const closeModalEvent = new CustomEvent('close_modal_refresh', {});
    this.dispatchEvent(closeModalEvent);
  }

  showToast(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title,
        message,
        variant
      }),
    );
  }

}