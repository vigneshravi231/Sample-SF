


import { api, LightningElement, track } from "lwc";
import getProductInfo from "@salesforce/apex/RecallFormPartsLaborController.getProductInfo";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { FlowNavigationNextEvent, FlowNavigationPauseEvent } from "lightning/flowSupport";

export default class RecallFormPartsAndLabor extends LightningElement {
  @api laborRecordTypeId;
  @api partRecordTypeId;
  @api defaultTopic;

  @track currentPart = {};
  @track currentNumberedPart = {};
  @track currentPartName = '';
  @track currentPartDescription = '';
  @track currentLabor = {};

  @track numberedParts = [];

  @track laborClaims = [];
  @track partClaims = [];

  @track claimsToBeDeleted;

  laborOpen = false;
  partsOpen = false;

  saving = false;

  isChecked = false;

  editingLabor = false;
  editingPart = false;

  @api
  get claimsList() {
    return [...this.laborClaims, ...this.partClaims];
  }
  @api savedClaimsList;
  @api
  get deletedClaimsList() {
    return this.claimsToBeDeleted;
  }

  async connectedCallback() {
    if(this.savedClaimsList) {
      console.log(JSON.parse(JSON.stringify(this.savedClaimsList)), 'claims');
      const partClaimsList = [];
      const laborClaimsList = [];
      this.savedClaimsList.forEach(item => {
        if(item.RecordTypeId === this.partRecordTypeId) {
          partClaimsList.push(item);
        } else {
          laborClaimsList.push(item);
        }
      });
      this.partClaims = partClaimsList;
      this.laborClaims = laborClaimsList;
      this.numberedParts = await this.formatParts(partClaimsList);
    }
  }

  @api
  get isDraft() {
    return this.saving;
  }

  get noClaimProducts() {
    return this.laborClaims.length === 0 && this.partClaims.length === 0;
  }

  get hasLaborClaims() {
    return this.laborClaims.length > 0;
  }

  get hasPartClaims() {
    return this.partClaims.length > 0;
  }

  get inputIsOpen() {
    return this.partsOpen || this.laborOpen;
  }

  openLabor() {
    this.laborOpen = true;
  }

  openPart() {
    this.partsOpen = true;
  }

  closeLabor() {
    this.laborOpen = false;
    this.editingLabor = false;
  }

  closeParts() {
    this.partsOpen = false;
    this.editingPart = false;
  }

  get numberedLabor() {
    return this.laborClaims.map((item, index) => {
      return {
        ...item,
        index: index + 1,
        key: "labor" + index
      }
    });
  }

  addLabor(event) {
    event.preventDefault();

    const fields = event.detail.fields;
    fields.RecordTypeId = this.laborRecordTypeId;
    fields.Topic_1__c = this.defaultTopic;

    if(this.currentLabor.Id) {
      fields.Id = this.currentLabor.Id;
    }

    this.laborClaims = [...this.laborClaims, fields];

    this.currentLabor = {};

    this.laborOpen = false;
  }

  async addPart(event) {
    event.preventDefault();

    const fields = event.detail.fields;
    fields.RecordTypeId = this.partRecordTypeId;
    fields.Topic_1__c = this.defaultTopic;

    if(this.currentPart.Id) {
      fields.Id = this.currentPart.Id;
    }

    this.partClaims = [...this.partClaims, fields];

    const formattedResult = {
      Name: this.currentPartName,
      Description: this.currentPartDescription,
      ...fields
    }
    this.numberedParts = [...this.numberedParts, formattedResult];

    this.currentPart = {};
    this.currentNumberedPart = {};

    this.partsOpen = false;
  }

  onProductUpdate(event) {
    if(event.detail.value[0]) {
      getProductInfo({ productIds: [event.detail.value[0]] })
        .then(result => {
          this.currentPartDescription = result[event.detail.value[0]].Description;
          this.currentPartName = result[event.detail.value[0]].Name;
        })
        .catch(error => auraExceptionHandler.logAuraException(error));
    }
  }

  async formatParts(objects) {
    const productIds = objects.map(item => item.Product__c);
    let productMap = await getProductInfo({ productIds: productIds })
      .then(result => {
        return result;
      })
      .catch(error => auraExceptionHandler.logAuraException(error));

    return objects.map(item => {
      return {
        ...item,
        ...productMap[item.Product__c],
        index: Number(this.numberedParts.length) + 1,
        key: 'part' + this.numberedParts.length,
      }
    });
  }

  deleteLabor(event) {
    const [laborClaim] = this.laborClaims.splice(Number(event.target.dataset.rowValue), 1);
    if(this.savedClaimsList) {
      this.claimsToBeDeleted = this.claimsToBeDeleted ? [...this.claimsToBeDeleted, laborClaim] : [laborClaim];
    }
  }

  deleteParts(event) {
    this.numberedParts.splice(Number(event.target.dataset.rowValue), 1);
    const [partClaim] = this.partClaims.splice(Number(event.target.dataset.rowValue), 1);
    if(this.savedClaimsList) {
      this.claimsToBeDeleted = this.claimsToBeDeleted ? [...this.claimsToBeDeleted, partClaim] : [partClaim];
    }
  }

  editLabor(event) {
    let [edited] = this.laborClaims.splice(Number(event.target.dataset.rowValue), 1);
    this.currentLabor = edited;
    this.editingLabor = true;
    this.openLabor();
  }

  editParts(event) {
    let [editedNumbered] = this.numberedParts.splice(Number(event.target.dataset.rowValue), 1);
    let [editedClaim] = this.partClaims.splice(Number(event.target.dataset.rowValue), 1);
    this.currentPart = editedClaim;
    this.currentNumberedPart = editedNumbered;
    this.editingPart = true;
    this.openPart();
  }

  undoEditPart() {
    this.partClaims = [...this.partClaims, this.currentPart];
    this.numberedParts = [...this.numberedParts, this.currentNumberedPart];
    this.currentPart = {};
    this.currentNumberedPart = {};
    this.closeParts();
  }

  undoEditLabor() {
    this.laborClaims = [...this.laborClaims, this.currentLabor];
    this.currentLabor = {};
    this.closeLabor();
  }

  saveCase() {
    this.saving = true;
    const navigateNextEvent = new FlowNavigationNextEvent();
    this.dispatchEvent(navigateNextEvent);
  }

  nextScreen() {
    if(this.template.querySelector('[data-id=checked]')?.reportValidity()) {
      sessionStorage.clear();
      const navigateNextEvent = new FlowNavigationNextEvent();
      this.dispatchEvent(navigateNextEvent);
    }
  }
}