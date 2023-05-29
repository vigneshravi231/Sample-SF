


import { api, LightningElement } from "lwc";

export default class PaymentMethodSvg extends LightningElement {

  loaded;

  @api size;
  @api pixels;
  @api icon;

  //default size of icon
  containerSizeInPixels = 40;

  iconMap = {}

  sizeMap = {
    xxsmall: 25,
    xsmall: 75,
    small: 100,
    medium: 200,
    large: 300,
  }

  connectedCallback() {
    if(this.icon) {
      this.iconMap[this.icon] = true;
    } else {
      this.iconMap.Generic = true;
    }

    this.loaded = true;
  }

  //Pixel setting will override a height value
  get container() {
    if(this.size) {
      this.containerSizeInPixels = this.size;
    }

    if(this.pixels) {
      this.containerSizeInPixels = this.pixels;
    }

    return 'width: ' + this.containerSizeInPixels + 'px';
  }

}