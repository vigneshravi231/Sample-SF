

import { api, LightningElement, track } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import getDisplayedField from "@salesforce/apex/RecallFormCustomFieldController.getDisplayedField";

export default class RecallFormCustomField extends LightningElement {

  // Deprecated
  @track repairId;
  @track repairEmail;
  @api initialRepairTechId;
  @api initialRepairTechEmail;
  @api
  get repairTechId() {
    return this.repairId;
  }
  @api
  get repairTechEmail() {
    return this.repairEmail;
  }


  @track lookupFieldValue;
  @track displayFieldValue;

  // api values
  @api assetId;
  @api inputLookupValue;
  @api inputDisplayValue;

  @api lookupFieldName;// = "Dealer_Rep__c";
  @api lookupFieldLabel;// = "Repairing Tech";

  @api displayObjectName;// = "Contact";
  @api displayFieldName;// = "Email";
  @api displayFieldLabel;// = "Repair Tech Email";
  @api layoutVertical;// = true;

  @api
  get outputLookupValue() {
    return this.lookupFieldValue;
  }

  @api
  get outputDisplayValue() {
    return this.displayFieldValue;
  }

  get sizeValue() {
    return this.layoutVertical ? "12" : "6";
  }

  get paddingValue() {
    return this.layoutVertical ? "" : "horizontal-small";
  }

  get pullToBoundaryValue() {
    return this.layoutVertical ? "" : "small";
  }

  get sessionStorageKey() {
    return `${this.lookupFieldName}${this.displayObjectName}${this.displayFieldName}${this.assetId}`;
  }

  connectedCallback() {
    let cachedSelection = sessionStorage.getItem(this.sessionStorageKey);
    console.log(cachedSelection, 'cached' + this.lookupFieldName);

    //if a user selection value was stored and it's a valid option - set as the selection
    //else use the default input variable from the flow screen
    if(this.inputLookupValue && this.inputLookupValue?.trim().length > 0) {
      this.lookupFieldValue = this.inputLookupValue;
      this.displayFieldValue = this.inputDisplayValue;
    } else if(cachedSelection) {
      this.updateDisplayField(cachedSelection);
      //clear after we've retrieved it
      sessionStorage.removeItem(this.sessionStorageKey);
    }
  }

  onLookupFieldChange(event) {
    sessionStorage.setItem(this.sessionStorageKey, event.detail.value[0]);
    this.updateDisplayField(event.detail.value[0]);
  }

  updateDisplayField(recordId) {
    this.lookupFieldValue = recordId;
    getDisplayedField({
      recordId,
      fieldName: this.displayFieldName,
      objectName: this.displayObjectName
    })
      .then(result => {
        this.displayFieldValue = result;
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }
}