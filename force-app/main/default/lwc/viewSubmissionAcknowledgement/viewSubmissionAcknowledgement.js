


import { LightningElement } from "lwc";

export default class ViewSubmissionAcknowledgement extends LightningElement {
  showModal = false;

  openAcknowledgement() {
    this.showModal = true;
  }
  closeAcknowledgement() {
    this.showModal = false;
  }
}