


import { api, LightningElement, track } from "lwc";
import { FlowNavigationNextEvent, FlowNavigationPauseEvent } from "lightning/flowSupport";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import getAssetInformation from "@salesforce/apex/RecallFormCustomFieldController.getAssetInformation";
import getDisplayedField from "@salesforce/apex/RecallFormCustomFieldController.getDisplayedField";

export default class RecallFormCustomSection extends LightningElement {

  @api initialAccountId;
  @api initialAssetId;
  @api initialRepairDateIn;
  @api initialRepairTechId;
  @api initialRepairDateOut;
  @api initialMileageCyclesIn;
  @api initialDealerRoPo;
  @api initialMileageCyclesOut;
  @api initialCustomerName;
  @api initialCustomerEmail;
  @api initialRecalledAsset;
  @api initialConcern;
  @api initialCause;
  @api initialCorrection;
  @api initialSpecialNumber;
  @api initialSpecialAmount;

  @track accountId;
  @track accountNumber;
  @track assetId;
  @track vinSerial;
  @track productPart;
  @track repairDateIn;
  @track repairTechId;
  @track repairDateOut;
  @track repairTechEmail;
  @track mileageCyclesIn;
  @track dealerRoPo;
  @track mileageCyclesOut;
  @track customerName;
  @track customerEmail;
  @track recalledAsset;
  @track concern;
  @track cause;
  @track correction;
  @track specialNumber;
  @track specialAmount = 0;

  @track savingClaim;
  @track emptyRepairTech = false;

  get allRequiredFieldsFilled() {
    return !(!this.accountId || !this.assetId
      || !this.repairDateIn || !this.repairDateOut
      || !this.repairTechId || !this.mileageCyclesIn
      || !this.dealerRoPo || !this.mileageCyclesOut
      || !this.customerName || !this.concern
      || !this.cause || !this.correction);
  }

  @api
  get outputAccountId() {
    return this.accountId;
  }

  @api
  get outputAccountNumber() {
    return this.accountNumber;
  }

  @api
  get outputAssetId() {
    return this.assetId;
  }

  @api
  get outputVinSerial() {
    return this.vinSerial;
  }

  @api
  get outputProductPart() {
    return this.productPart;
  }

  @api
  get outputRepairDateIn() {
    return this.repairDateIn;
  }

  @api
  get outputRepairTechId() {
    return this.repairTechId;
  }

  @api
  get outputRepairTechEmail() {
    return this.repairTechEmail;
  }

  @api
  get outputRepairDateOut() {
    return this.repairDateOut;
  }

  @api
  get outputMileageCyclesIn() {
    return this.mileageCyclesIn;
  }

  @api
  get outputDealerRoPo() {
    return this.dealerRoPo;
  }

  @api
  get outputMileageCyclesOut() {
    return this.mileageCyclesOut;
  }

  @api
  get outputCustomerName() {
    return this.customerName;
  }

  @api
  get outputCustomerEmail() {
    return this.customerEmail;
  }

  @api
  get outputRecalledAsset() {
    return this.recalledAsset;
  }

  @api
  get outputConcern() {
    return this.concern;
  }

  @api
  get outputCause() {
    return this.cause;
  }

  @api
  get outputCorrection() {
    return this.correction;
  }

  @api
  get outputSpecialNumber() {
    return this.specialNumber;
  }

  @api
  get outputSpecialAmount() {
    return this.specialAmount;
  }

  @api
  get isDraft() {
    return this.savingClaim;
  }

  connectedCallback() {
    if(this.initialAccountId) {
      this.updateAccountNumber(this.initialAccountId);
    }

    if(this.initialAssetId) {
      this.updateAssetInfo(this.initialAssetId);
    }

    if(this.initialRepairDateIn) {
      this.repairDateIn = this.initialRepairDateIn;
    }

    if(this.initialRepairTechId) {
      this.updateRepairTechEmail(this.initialRepairTechId);
    }

    if(this.initialRepairDateOut) {
      this.repairDateOut = this.initialRepairDateOut;
    }

    if(this.initialMileageCyclesIn) {
      this.mileageCyclesIn = this.initialMileageCyclesIn;
    }

    if(this.initialDealerRoPo) {
      this.dealerRoPo = this.initialDealerRoPo;
    }

    if(this.initialMileageCyclesOut) {
      this.mileageCyclesOut = this.initialMileageCyclesOut;
    }

    if(this.initialCustomerName) {
      this.customerName = this.initialCustomerName;
    }

    if(this.initialCustomerEmail) {
      this.customerEmail = this.initialCustomerEmail;
    }

    if(this.initialRecalledAsset) {
      this.recalledAsset = this.initialRecalledAsset;
    }

    if(this.initialConcern) {
      this.concern = this.initialConcern;
    }

    if(this.initialCause) {
      this.cause = this.initialCause;
    }

    if(this.initialCorrection) {
      this.correction = this.initialCorrection;
    }

    if(this.initialSpecialNumber) {
      this.specialNumber = this.initialSpecialNumber;
    }

    if(this.initialSpecialAmount) {
      this.specialAmount = this.initialSpecialAmount;
    }
  }

  onAccountIdChange(event) {
    sessionStorage.setItem('customSectionAccountId', event.detail.value[0]);
    this.updateAccountNumber(event.detail.value[0]);
  }

  onAssetIdChange(event) {
    sessionStorage.setItem('assetInfoAssetId', event.detail.value[0]);
    this.updateAssetInfo(event.detail.value[0]);
  }

  onRepairDateInChange(event) {
    sessionStorage.setItem('assetInfoRepairDateIn', event.detail.value);
    this.repairDateIn = event.detail.value;
  }

  onRepairDateOutChange(event) {
    sessionStorage.setItem('assetInfoRepairDateOut', event.detail.value);
    this.repairDateOut = event.detail.value;
  }

  onMileageCyclesInChange(event) {
    sessionStorage.setItem('customSectionMileageCyclesIn', event.detail.value);
    this.mileageCyclesIn = event.detail.value;
  }

  onDealerRoPoChange(event) {
    sessionStorage.setItem('assetInfoDealerRoPo', event.detail.value);
    this.dealerRoPo = event.detail.value;
  }

  onMileageCyclesOutChange(event) {
    sessionStorage.setItem('customSectionMileageCyclesOut', event.detail.value);
    this.mileageCyclesOut = event.detail.value;
  }

  onCustomerNameChange(event) {
    sessionStorage.setItem('customSectionCustomerName', event.detail.value);
    this.customerName = event.detail.value;
  }

  onCustomerEmailChange(event) {
    sessionStorage.setItem('customSectionCustomerEmail', event.detail.value);
    this.customerEmail = event.detail.value;
  }

  onRecalledAssetChange(event) {
    sessionStorage.setItem('customSectionRecalledAsset', event.detail.value);
    this.recalledAsset = event.detail.value;
  }

  onConcernChange(event) {
    sessionStorage.setItem('customSectionConcern', event.detail.value);
    this.concern = event.detail.value;
  }

  onCauseChange(event) {
    sessionStorage.setItem('customSectionCause', event.detail.value);
    this.cause = event.detail.value;
  }

  onCorrectionChange(event) {
    sessionStorage.setItem('customSectionCorrection', event.detail.value);
    this.correction = event.detail.value;
  }

  onSpecialNumberChange(event) {
    sessionStorage.setItem('customSectionSpecialNumber', event.detail.value);
    this.specialNumber = event.detail.value;
  }

  onSpecialAmountChange(event) {
    sessionStorage.setItem('customSectionSpecialAmount', event.detail.value);
    this.specialAmount = event.detail.value;
  }

  updateAssetInfo(recordId) {
    this.assetId = recordId;
    getAssetInformation({ recordId })
      .then(result => {
        this.vinSerial = result.VIN_Serial_Number__c;
        this.productPart = result.Product2?.Name;
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }

  updateAccountNumber(recordId) {
    this.accountId = recordId;
    getDisplayedField({
      recordId,
      fieldName: 'AccountNumber',
      objectName: 'Account'
    })
      .then(result => {
        this.accountNumber = result;
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }

  updateRepairTechEmail(recordId) {
    this.repairTechId = recordId;
    getDisplayedField({
      recordId,
      fieldName: 'Email',
      objectName: 'Contact'
    })
      .then(result => {
        this.repairTechEmail = result;
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }

  clearRepairTechId() {
    this.repairTechId = null;
  }

  selectRepairTech(event) {
    this.repairTechId = event.detail.selectedContact.Id;
    this.repairTechEmail = event.detail.selectedContact.Email;
    sessionStorage.setItem('customSectionRepairTechId', event.detail.selectedContact.Id);
    console.log(JSON.parse(JSON.stringify(event.detail.selectedContact)), 'repair tech selected');
  }

  checkValidity() {
    this.template.querySelector('.repairDateIn').reportValidity();
    this.template.querySelector('.repairDateOut').reportValidity();
    this.template.querySelector('.dealerRoPo').reportValidity();
    this.template.querySelector('.customerName').reportValidity();
    this.template.querySelector('c-custom-repair-tech-contact-lookup').checkValidity();
  }

  verifyFields(event) {
    event.preventDefault();
  }

  saveCase() {
    this.savingClaim = true;
    const navigateNextEvent = new FlowNavigationNextEvent();
    this.dispatchEvent(navigateNextEvent);
  }

  nextScreen() {
    if(this.allRequiredFieldsFilled) {
      const navigateNextEvent = new FlowNavigationNextEvent();
      this.dispatchEvent(navigateNextEvent);
    } else {
      this.template.querySelector('.hidden').click();
    }
  }
}