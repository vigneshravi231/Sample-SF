


import { LightningElement, api } from "lwc";
import {logProxy } from "c/utils";

export default class ShippingTypes extends LightningElement {
  @api checkoutOptions;
  selectedCheckoutOption;

  @api
  get hasCheckoutOptions() {
    return this.checkoutOptions && this.checkoutOptions.length > 0;
  }

  selectCheckoutOption(event) {
    this.selectedCheckoutOption = this.checkoutOptions.find(option => option.value == event.target.value);

    let eventObj = {
      option: this.selectedCheckoutOption,
      remove: !event.target.checked
    }

    const selectedEvent = new CustomEvent('select_checkout_option', {
      detail: eventObj
    });

    this.dispatchEvent(selectedEvent);
  }

}