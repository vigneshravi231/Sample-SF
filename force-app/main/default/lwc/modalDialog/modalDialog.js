

import { LightningElement, api } from "lwc";

export default class ModalDialog extends LightningElement {
  @api hideCloseButton;
  @api showModal;
  @api size;

  @api show(){
    this.showModal = true;
  }

  @api hide(){
    this.showModal = false;
  }

  handleDialogClose() {
    let details = { showModal: false, bubbles: true, composed: true };
    const toggleModal = new CustomEvent("closemodal", { detail: details, bubbles: true, composed: true });
    this.dispatchEvent(toggleModal);
    this.showModal = false;
  }

  get modalClass() {
    let base = "slds-modal slds-fade-in-open";
    return this.size !== "" ? " slds-modal_" + this.size + " " + base : base;
  }
}
