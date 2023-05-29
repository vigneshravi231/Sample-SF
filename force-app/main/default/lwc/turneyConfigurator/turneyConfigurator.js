

import { LightningElement } from "lwc";

export default class TurneyConfigurator extends LightningElement {

  async handleCancel(){
    this.webconfigurator.removeCachedConfigurationID();
  }

  async handleSubmit(){
    await this.webconfigurator.addToCart({
      successMessage: 'Successfully added configured Turny to cart'
    })
  }

  get webconfigurator(){
    return this.template.querySelector('c-product-web-configurator');
  }
}
