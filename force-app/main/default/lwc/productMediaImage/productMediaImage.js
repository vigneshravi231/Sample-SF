

import { LightningElement, api } from "lwc";

export default class ProductMediaImage extends LightningElement {

  //Return type - ConnectApi.ProductMediaImage
  //can be passed in
  @api productMediaObject;

  //Or the individual parameters from it
  @api alternateText;
  @api contentVersionId;
  @api id;
  @api mediaType;
  @api sortOrder;
  @api thumbnailUrl;
  @api title;
  @api url;

  connectedCallback() {
    if(this.ifFullObjectProvided()){
      this.mapParams();
    }
  }

  get fullUrl() {
    return this.communityNameFromUrl() + this.url;
  }

  mapParams(){
    this.alternateText = this.productMediaObject.alternateText;
    this.contentVersionId = this.productMediaObject.contentVersionId;
    this.id = this.productMediaObject.id;
    this.mediaType = this.productMediaObject.mediaType;
    this.sortOrder = this.productMediaObject.sortOrder;
    this.thumbnailUrl = this.productMediaObject.thumbnailUrl;
    this.title = this.productMediaObject.title;
    this.url = this.productMediaObject.url;
  }

  ifFullObjectProvided() {
    let mediaObject = this.productMediaObject;
    return mediaObject !== '' && mediaObject !== null && mediaObject !== undefined;
  }

  communityNameFromUrl() {
    return window.location.pathname.split('/s/')[0];
  }
}
