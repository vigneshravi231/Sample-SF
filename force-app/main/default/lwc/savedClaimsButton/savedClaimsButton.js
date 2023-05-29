


import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";

export default class SavedClaimsButton extends NavigationMixin(LightningElement) {

  navigateToSavedClaims() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "Saved_Claims__c"
      }
    })
  }
}