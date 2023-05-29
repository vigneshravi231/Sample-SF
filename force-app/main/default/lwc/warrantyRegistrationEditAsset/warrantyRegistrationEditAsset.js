

import { LightningElement, api, track } from "lwc";
import { Redux } from "c/lwcRedux";
import { warranty as warrantyModule } from "c/reduxStore";
import { sureThing } from "c/utils";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import _fetchAssetInfo from "@salesforce/apex/WarrantyRegistrationEditAssetController.fetchPrefilledFormBasedOnAsset";
import _fetchDealerInfo from "@salesforce/apex/WarrantyRegistrationEditAssetController.fetchDealerInfo";

const fetchAssetInfo = sureThing(_fetchAssetInfo);
const fetchDealerInfo = sureThing(_fetchDealerInfo);

export default class WarrantyRegistrationAsset extends Redux(LightningElement) {
  showSpinner;
  @track warranty = { record: { Dealer__r: {} } };
  @api showModal;

  productType;

  @api
  async edit(warranty) {
    // vin # is formula field so it gets removed
    // from record by the lightning-record-edit-form
    // each time we submit - this is to fix the display
    warranty.record.VIN_Serial_Number__c = warranty.vin;

    this.showModal = true;
    this.warranty = warranty;

    if(!!warranty.record?.ProductType__c){
      this.productType = warranty.record.ProductType__c;
    }

    if (!!warranty.record.Dealer__c) {
      await this.$updateDealerId(warranty.record.Dealer__c);
    }
  }

  @api
  async fromAsset(assetId) {
    // creating new warranty from asset id
    const recordTemplate = warrantyModule.template();

    const newWarranty = {
      uuid: null,
      vin: null,
      record: {
        ...recordTemplate,
        AssetId: assetId
      }
    };

    this.showModal = true;
    this.warranty = newWarranty;
    await this.$prefillAssetInfo(assetId);
  }

  @api close() {
    this.closeModal();
  }

  get isWAV() {
    return this.productType === 'WAV';
  }

  get isLift() {
    return this.productType === 'Lift';
  }

  get isSeat() {
    return this.productType === 'Seat';
  }

  mapDispatchToProps() {
    return {
      add: warrantyModule.actions.addWarranty,
      edit: warrantyModule.actions.editWarranty,
      setProductType: warrantyModule.actions.setProductType
    };
  }

  closeModal() {
    this.showModal = false;
    this.template.querySelector("c-modal-dialog").hide();
  }

  get record() {
    return this.warranty.record || {};
  }

  onSubmit(event) {
    event.stopPropagation();
    event.preventDefault();

    const record = event.detail.fields;
    if(this.productType !== 'WAV') {
      record.C_of_O_Form_Required__c = 'No';
    }

    if(!this.isEdit) {
      record.Mileage_at_Time_of_Sale__c = record.Cycle_Count__c;
    }

    const warranty = { ...this.warranty, record };

    console.log(JSON.parse(JSON.stringify(warranty)), 'warranty');

    this.props.setProductType(this.productType);

    this.isEdit ? this.props.edit(warranty) : this.props.add(warranty);

    this.closeModal();
  }

  async handleAssetSelection(event) {
    const selectedAssetId = event.currentTarget.value;

    if (!!selectedAssetId) {
      await this.$prefillAssetInfo(selectedAssetId);
    }
  }

  async handleDealerSelection(event) {
    const dealerId = event.currentTarget.value;

    if (!!dealerId) {
      await this.$updateDealerId(dealerId);
    } else {
      this.warranty.record.Dealer_ID__c = null;
    }
  }

  async $updateDealerId(dealerId) {
    const { ok, error, data } = await fetchDealerInfo({ dealerId });

    if (ok) {
      this.warranty.record.Dealer_ID__c = data.DealerNumberId__c;
    } else {
      auraExceptionHandler.logAuraException(error);
    }

  }

  async $prefillAssetInfo(assetId) {
    const { ok, error, data } = await fetchAssetInfo({
      recordId: assetId
    });

    if (ok) {
      this.prefillAssetInfo(data);
      console.log(data, 'asset Info');
      this.productType = data.productType;
    } else {
      auraExceptionHandler.logAuraException(error);
    }
  }

  prefillAssetInfo(info) {
    const generateContactName = contact => {
      const first = contact.FirstName ? contact.FirstName : "";
      const last = contact.LastName ? contact.LastName : "";
      const space = contact.FirstName ? " " : "";

      return first + space + last;
    };

    const prefilled = {
      Sales_Person_Name__c: generateContactName(info.contact),
      Sales_Person_Email__c: info.contact.Email,
      VIN_Serial_Number__c: info.asset.VIN_Serial_Number__c,
      Address_1__c: info.asset.Account?.BillingStreet,
      Address_2__c: "",
      City__c: info.asset.Account?.BillingCity,
      State_Province__c: info.asset.Account?.BillingState,
      Zip_Postal_Code__c: info.asset.Account?.BillingPostalCode,
      Country__c: info.asset.Account?.BillingCountry,
      Customer_Phone__c: info.asset.Account?.Phone,
      Customer_Email__c: info.asset.Account?.Email_Address__c,
      Purchase_Date__c: info.asset.PurchaseDate,
      Model__c: info.asset.Model__c
    };

    const record = { ...this.warranty.record, ...prefilled };

    if (!record.Dealer__c) {
      record.Dealer__c = info.currentAccount.Id;
      record.Dealer_ID__c = info.currentAccount.DealerNumberId__c;
    }

    this.warranty = {
      ...this.warranty,
      vin: info.asset.VIN_Serial_Number__c,
      record
    };
  }

  get isEdit() {
    return !!this.warranty.uuid;
  }

  get buttonLabel() {
    return this.isEdit ? "Edit Asset" : "Add Asset";
  }

  @track
  showDependentFieldState = {
    Customer_is_a_Veteran__c: false,
    C_of_O_Form_Required__c: false,
    Conversion_Use__c: false
  };

  handleShowDependentField(event) {
    //Dependent fields are mapped by data attribute controllingfieldapiname
    let controllingFieldApiName =
      event.currentTarget.dataset.controllingfieldapiname;
    let value = event.currentTarget.value;
    let result;

    switch (controllingFieldApiName) {
      case "Customer_is_a_Veteran__c":
        result = !this.showDependentFieldState[controllingFieldApiName];
        break;
      case "C_of_O_Form_Required__c":
        result = value === "Yes";
        break;
      case "Conversion_Use__c":
        result = value === "Business" && this.productType !== 'Seat';
        break;
      default:
        result = !this.showDependentFieldState[controllingFieldApiName];
    }

    this.showDependentFieldState[controllingFieldApiName] = result;
  }

  hideSpinner() {
    this.showSpinner = false;
  }
}
