


import { api, LightningElement } from "lwc";
import * as Constants from "./constants.js";
import { logProxy } from "c/utils";
// import validatePurchaseOrderNumber from '@salesforce/apex/PaymentComponentController.validatePurchaseOrderNumber'


export default class PaymentPurchaseOrder extends LightningElement {

  _purchaseOrderErrorMessage;
  _purchaseOrderNumber;

  @api
  get purchaseOrderErrorMessage() {
    return this._purchaseOrderErrorMessage;
  }

  @api
  get purchaseOrderNumber() {
    return this._purchaseOrderNumber;
  }

  // handlePurchaseOrderNumberChange(event) {
  //   this._purchaseOrderNumber = event.target.value;
  //   event.target.reportValidity();
  // }

  handlePurchaseOrderNumberChange(event) {
    this.handleCartUpdate({ field: "PoNumber", value: event.target.value });
  }

  handleCartUpdate(detail) {
    this.dispatchEvent(new CustomEvent('cart_update', { detail : detail, bubbles: true, composed: true }));
  }

  async handleSubmit(event) {

    if (!this._purchaseOrderNumber) {
      this._purchaseOrderErrorMessage = this.labels.ValidationMessagePONumberIsRequired;
      return;
    }

    this.handleCartUpdate({ field: "PoNumber", value: this._purchaseOrderNumber });

    // let isUnique = await validatePurchaseOrderNumber({
    //   purchaseOrderNumber: this._purchaseOrderNumber,
    //   accountId: this.initContext.accountId
    // });

    // if (isUnique) {
    //
    //   this._purchaseOrderErrorMessage = null;
    //
    //   const submitToParentEvent = new CustomEvent('submit', {
    //     detail: {
    //       chosenPaymentOption: 'PurchaseOrderNumber',
    //       purchaseOrderNumber: this._purchaseOrderNumber,
    //       contactPointAddress: null
    //     }
    //   });
    //   this.dispatchEvent(submitToParentEvent);
    // } else {
    //   this._purchaseOrderErrorMessage = this.labels.ValidationMessagePONumberNotUnique;
    // }
  }

  get labels() {
    return Constants.labels;
  }

}