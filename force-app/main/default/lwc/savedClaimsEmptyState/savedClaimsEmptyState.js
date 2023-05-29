

import { LightningElement, track } from "lwc";
import hasNoSavedClaims from "@salesforce/apex/SavedClaimsController.hasNoSavedClaims";
import { auraExceptionHandler } from "c/auraExceptionHandler";

export default class SavedClaimsEmptyState extends LightningElement {
  @track noPausedFlows = false;

  connectedCallback() {
    hasNoSavedClaims()
      .then(result => {
        this.noPausedFlows = result;
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }

  refreshPage() {
    window.location.reload();
  }
}