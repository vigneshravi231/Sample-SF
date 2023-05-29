

import { api, LightningElement, track } from "lwc";
import { FlowNavigationNextEvent, FlowNavigationPauseEvent } from "lightning/flowSupport";

export default class RecallFormFlowNavigation extends LightningElement {

  @track saving = false;

  @api
  get isDraft() {
    return this.saving;
  }

  saveCase() {
    this.saving = true;
    const navigatePauseEvent = new FlowNavigationPauseEvent();
    this.dispatchEvent(navigatePauseEvent);
  }

  nextScreen() {
    const navigateNextEvent = new FlowNavigationNextEvent();
    this.dispatchEvent(navigateNextEvent);
  }
}