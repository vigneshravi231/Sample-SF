


import { LightningElement, api } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import upsertContactPointAddress from '@salesforce/apex/contactPointAddressFormController.upsertContactPointAddress';
import {deepClone} from "c/utils";

import {ContextProvider} from "c/communityContextProvider";

export default class AddContactPointAddressForm extends ContextProvider(LightningElement) {
  addressError = [];

  loaded;

  addressTypeOption = [
    {'label': 'Shipping Address', 'value': 'Shipping'},
    {'label': 'Billing Address', 'value': 'Billing'}
  ];

  validity;

  @api editAddressPrefill;

  address = {
    Id: '',
    name: '',
    street: '',
    city: '',
    state: '',
    province: '',
    postalCode: '',
    country: 'US',
    addressType: "Shipping",
    isDefault: false
  };

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

  connectedCallback() {
    this.loaded = true;
    if(this.editAddressPrefill) {
      this.address = deepClone(this.editAddressPrefill);
    }
  }

  handleNameChange(event) {
    this.address.name = event.target.value;
  }

  handleTypeChange(event) {
    this.address.addressType = event.target.value;
  }

  countryProvinceMap = {
    US: this.states,
  };

  countryOptions = [
    { label: 'United States', value: 'US' },
  ];

  get getProvinceOptions() {
    return this.countryProvinceMap[this._country];
  }

  get getCountryOptions() {
    return this.countryOptions;
  }

  handleChange(event) {
    this.address.street = event.detail.street;
    this.address.city = event.detail.city;
    this.address.state = event.detail.province;
    this.address.province = event.detail.province;
    this.address.postalCode = event.detail.postalCode;
    this.address.country = event.detail.country;
    this._country = event.detail.country;
    this.validity = event.detail.validity;
  }

  @api upsertAddress() {
    this.loaded = false;
    if(!this.loaded && this.isValid()) {
      upsertContactPointAddress({ ctx: this.communityContext, addressForm: this.address })
        .then((result) => {
          this.onSuccess(result);
        })
        .catch((error) => {
          auraExceptionHandler.logAuraException(error);
        });
    }
  }

  onSuccess(contactPointAddress) {
    let displayAddress = this.transformToContactPointAddressFullFormat(contactPointAddress);
    let detail = { address: displayAddress, type: this.address.addressType, raw: contactPointAddress };
    this.dispatchEvent(new CustomEvent('address_added', { detail: detail, bubbles: true }));
    this.loaded = true;
  }

  transformToContactPointAddressFullFormat(contactPointAddress) {
    let displayAddress = {};

    //Transform is required because new addresses dont return all fields
    //like a flow does, so transform minimum required data for display
    contactPointAddress.Address = {
      city: contactPointAddress.City,
      country: contactPointAddress.Country,
      geocodeAccuracy: null,
      postalCode: contactPointAddress.PostalCode,
      state: contactPointAddress.State,
      street: contactPointAddress.Street,
    };

    displayAddress.Name = contactPointAddress.Name;
    displayAddress.Id = contactPointAddress.Id;
    displayAddress.State = contactPointAddress.State;
    displayAddress.state = contactPointAddress.State;
    displayAddress.Street = contactPointAddress.Street;
    displayAddress.City = contactPointAddress.City;
    displayAddress.Country = contactPointAddress.Country;
    displayAddress.Province = contactPointAddress.Province;
    displayAddress.PostalCode = contactPointAddress.PostalCode;
    displayAddress.addressType = contactPointAddress.addressType;

    return displayAddress;
  }

  isValid() {
    const address = this.template.querySelector('lightning-input-address');
    const isValid = address.checkValidity();
    this.addressError = [];
    if(isValid && this.address.name !== '') {
      return true;
    } else {
      this.loaded = true;
      this.addressError.push("Please fill in all fields");
      return false;
    }
  }

}
