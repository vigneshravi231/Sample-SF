


import { LightningElement, api, wire } from "lwc";
import { getRecord } from 'lightning/uiRecordApi';


export default class RecordBannerNoActions extends LightningElement {

  @api recordId;
  recordName;
  wireLoaded;

  @wire(getRecord, { recordId: '$recordId', layoutTypes: ['Full']})
  wiredRecord({ error, data }) {
    if(data) {
      console.log(data);
      this.wireLoaded = true;
      this.recordName = data.fields?.Name.value;
    } else if(error){
      console.log('RecordBannerNoActions Error: ',error);
    }
  }

}