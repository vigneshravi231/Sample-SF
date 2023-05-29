
import { LightningElement, api, track } from "lwc";

export default class Accordion extends LightningElement {
  @api title;

  @track status = "closed";

  get classes() {
    return {
      chevronDown: this.isClosed ? "slds-p-bottom_medium slds-hide" : "slds-p-bottom_medium",
      chevronUp: this.isClosed ? "slds-p-bottom_medium" : "slds-p-bottom_medium slds-hide",
      body: this.isClosed ? "slds-m-bottom_medium slds-accordion__content slds-hide" : "slds-m-bottom_medium slds-accordion__content",
    };
  }

  get isClosed() {
    return this.status === "closed";
  }

  @api open() {
    this.toggle("open");
  }

  @api close() {
    this.toggle("closed");
  }

  handleToggleClick() {
    this.toggle();
  }

  toggle(status) {
    this.status = status || (this.isClosed ? "open" : "closed");
  }
}
