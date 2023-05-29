


import { api, LightningElement } from "lwc";
import SampleTerms from '@salesforce/label/c.Sample_One_Time_Checkout_Terms';
import insertOneTimeShippingAddress from '@salesforce/apex/CartCheckoutController.insertOneTimeShippingAddress';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import { Redux } from "c/lwcRedux";
import { checkout } from "c/reduxStore";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { logProxy } from "c/utils";

const canadianProvinces = [
  { label: "Newfoundland", value: "NL" },
  { label: "Prince Edward Island", value: "PE" },
  { label: "Nova Scotia", value: "NS" },
  { label: "New Brunswick", value: "NB" },
  { label: "Quebec", value: "QC" },
  { label: "Ontario", value: "ON" },
  { label: "Manitoba", value: "MB"},
  { label: "Saskatchewan", value: "SK" },
  { label: "Alberta", value: "AB" },
  { label: "British Columbia", value: "BC" },
  { label: "Yukon", value: "YT" },
  { label: "Northwest Territories", value: "NT" },
  { label: "Nunavut", value: "NU" }
];

export default class OneTimeShippingForm extends Redux(LightningElement) {

  label = {
    SampleTerms
  };

  termsTitle;
  termsBody = [];
  acceptedTerms;
  validForm = false;
  validDropAddress = false;

  loaded = true;

  oneTimeShippingAddress = {
    Dealer_Name__c : '',
    Street: '',
    City: '',
    State: '',
    PostalCode: '',
    Country: 'US',
    Email__c: '',
    Authorized_By__c : '',
    Corporate_Title__c: '',
    One_Time_Shipping_Date__c: '',
    DropShip_Company_Name__c: '',
    DropShip_Phone__c: '',
    One_Time_Shipping__c: true,
    AddressType: 'Shipping',
    ParentId: '',
    Dealer_City__c: '',
    Dealer_Street__c: '',
    Dealer_State__c: '',
    Dealer_PostalCode__c: '',
    Name: 'TEST',
  }

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
    CA: canadianProvinces
  };

  countryOptions = [
    { label: "United States", value: "US" },
    { label: "Canada", value: "CA" }
  ];

  mapStateToProps(state) {
    return {
      addresses: state.checkout.addresses,
      buyerAccount: state.checkout.buyerAccount,
      buyerContact: state.checkout.contact
    };
  }

  mapDispatchToProps() {
    return {
      addAddress: checkout.actions.addAddress,
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupOneTimeShippingAddress();
    this.parseDisclaimerLabel();
    this.setTodaysDate();
  }

  get getProvinceOptions() {
    return this.countryProvinceMap[this._country];
  }

  parseDisclaimerLabel() {
    this.termsBody = this.label?.SampleTerms.split(/\r?\n/);
    if(this.termsBody.length) {
      this.termsTitle = this.termsBody[0];
      this.termsBody = this.termsBody.filter(t => t !== "" && t !== this.termsBody[0]);
    }
  }

  setupOneTimeShippingAddress() {
    let account = this.props.buyerAccount;
    let contact = this.props.buyerContact;

    this.oneTimeShippingAddress.Dealer_Name__c = account?.AccountNumber;
    this.oneTimeShippingAddress.Dealer_Street__c = account?.ShippingStreet;
    this.oneTimeShippingAddress.Dealer_City__c = account?.ShippingCity;
    this.oneTimeShippingAddress.Dealer_State__c = account?.ShippingState;
    this.oneTimeShippingAddress.Dealer_PostalCode__c = account?.ShippingPostalCode;
    this.oneTimeShippingAddress.Country = 'US';
    this.oneTimeShippingAddress.Authorized_By__c = contact.Name;
    this.oneTimeShippingAddress.Corporate_Title__c = contact?.Title;
    this.oneTimeShippingAddress.Drop = contact?.Title;
    this.oneTimeShippingAddress.Drop = contact?.Title;
    this.oneTimeShippingAddress.ParentId = account.Id
  }

  setTodaysDate() {
    let today = new Date();
    this.oneTimeShippingAddress.One_Time_Shipping_Date__c = today.toISOString();
  }

  handleDropShipAddressChange(event) {
    this._country = event.detail.country;
    this.oneTimeShippingAddress.Street = event.detail.street;
    this.oneTimeShippingAddress.City = event.detail.city;
    this.oneTimeShippingAddress.State = event.detail.province;
    this.oneTimeShippingAddress.PostalCode = event.detail.postalCode;
  }

  handleFieldChange(event) {
    let fieldName = event.currentTarget.dataset.fieldName;
    if(this.oneTimeShippingAddress.hasOwnProperty(fieldName)) {
      this.oneTimeShippingAddress[fieldName] = event.target.value;
    }
  }

  handlePhoneInput(event) {
    const phoneNumber = event.target.value
      .replace(/\D+/g, '')
      .match(/(\d{0,3})(\d{0,3})(\d{0,4})/);

    event.target.value =
      !phoneNumber[2] ? phoneNumber[1] : `(${phoneNumber[1]}) ${phoneNumber[2]}` + (phoneNumber[3] ? `-${phoneNumber[3]}` : ``);

    this.validateForm(event);
  }

  validateForm() {
      const allValid = [...this.template.querySelectorAll('.required-one-time-shipping-field')]
        .reduce((validSoFar, inputCmp) => {
          return validSoFar && inputCmp.checkValidity();
        }, true);

      this.validateDropAddress();
      this.validForm = allValid && this.validDropAddress && this.acceptedTerms;
      this.fireFormValidationEvent();
  }

  validateDropAddress() {
    const address = this.template.querySelector('.address-required-one-time-shipping-field');
    this.validDropAddress = address.checkValidity();
  }

  handleTerms(event) {
    this.acceptedTerms = event.target.checked;
    this.validateForm();
  }

  @api addOneTimeShippingAddress() {
    this.loaded = false;
      insertOneTimeShippingAddress({ oneTimeShippingAddress: this.oneTimeShippingAddress })
        .then((result) => {
          this.loaded = true;
          this.oneTimeShippingAddress = result;
          this.oneTimeShippingAddress.Address = {
            street: result.Street,
            city: result.City,
            country: result.Country,
            geocodeAccuracy: null,
            postalCode: result.PostalCode,
            state: result.State,
          }
          this.props.addAddress(this.oneTimeShippingAddress);
          this.hideOneTimeShipping();
          // console.log('SUCCESS: ' , result);
        })
        .catch((error) => {
          this.loaded = true;
          this.fireToastEvent('Error', 'An unexpected error occurred, please try again or contact Administrator', 'error')
          auraExceptionHandler.logAuraException(error);
        });
  }

  fireFormValidationEvent() {
    const oneTimeShippingValidationEvent = new CustomEvent('one_time_shipping_validation', { detail: this.validForm });
    this.dispatchEvent(oneTimeShippingValidationEvent);
  }

  fireToastEvent(title, message, variant) {
    const evt = new ShowToastEvent({
      title,
      message,
      variant
    });
    this.dispatchEvent(evt);
  }

  hideOneTimeShipping() {
    const hideOneTimeShipping = new CustomEvent('hide_one_time_shipping', {detail: this.oneTimeShippingAddress});
    this.dispatchEvent(hideOneTimeShipping);
  }

}