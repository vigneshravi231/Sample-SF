


import { api, LightningElement } from "lwc";

export default class CheckoutAddressSelector extends LightningElement {

  @api addressList;
  @api addressType;

  selectAddress(event) {
    this.dispatchEvent(new CustomEvent('select_address', {
      detail : { type: this.addressType, address: event.target.value }, bubbles: true
    }));
  }

}