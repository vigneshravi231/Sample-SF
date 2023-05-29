

import { api, track, LightningElement } from "lwc";
import getInitContext from "@salesforce/apex/PaymentOptionsController.tryGetInitContext";
import { logProxy } from "c/utils";
import { auraExceptionHandler } from "c/auraExceptionHandler";

export default class PaymentOptions extends LightningElement {

    @api cartState;
    @api netTerms;

    @track initContext = {};

    loaded;
    chosenPaymentOption;

    async connectedCallback() {
        await getInitContext({})
          .then(res => {
              this.initContext = res;
              this.loaded = true;
          })
          .catch(error => {
              this.loaded = true;
              auraExceptionHandler.logAuraException(error);
          });
    }

    get hasPaymentMethod() {
        return this.initContext.isCreditCardOnFileAvailable || this?.netTerms;
    }

    get options() {
        let options = [];

        if(this.initContext.isCreditCardOnFileAvailable) {
            options.push(this.createOptionsElement('Use Credit Card on File', 'ccOnFile'))
        }

        if(this?.netTerms) {
            options.push(this.createOptionsElement(`Use ${this.netTerms.NickName}`, 'netTerms'))

        }
        return options;
    }

    createOptionsElement(label, value) {
        return {
            label,
            value
        }
    }

    handlePOActive(event) {
        this.chosenPaymentOption = 'po';
        this.firePaymentOptionChangeEvent();
    }

    handleCCOnFileActive(event) {
        this.chosenPaymentOption = 'ccOnFile';
        this.firePaymentOptionChangeEvent();
    }

    handlePaymentMethodSelection(event) {
        if(event.target.value !== 'tab-1') {
            this.chosenPaymentOption = event.target.value;
            this.firePaymentOptionChangeEvent();
        }
    }

    firePaymentOptionChangeEvent() {
        const paymentOptionSelectedEvent = new CustomEvent("paymentoptionselected", {
            detail: this.chosenPaymentOption
        });
        this.dispatchEvent(paymentOptionSelectedEvent);
    }

}