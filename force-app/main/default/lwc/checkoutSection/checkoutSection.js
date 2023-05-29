


import { api, LightningElement } from "lwc";
import { Redux } from "c/lwcRedux";

export default class CheckoutSection extends Redux(LightningElement) {

  @api stepNumber;
  @api stepTitle;

  @api allowOverflow;
  @api hideBox;

  get boxClass() {
    if(this.hideBox) {
      return ''
    }
    return !this.allowOverflow ? 'slds-box overflow-hidden' : 'slds-box';
  }

}