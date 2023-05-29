

import { api, LightningElement } from "lwc";
import cancelCheckout from "@salesforce/apex/CheckoutCancelButtonController.cancelCheckout";
import { NavigationMixin } from "lightning/navigation";

export default class CheckoutCancelButton extends NavigationMixin(LightningElement)  {

    // input property
    @api cartId;

    async handleCancelCheckout(event) {
        let result = await cancelCheckout({cartId: this.cartId});
        if (result) {
            this.gotoCart();
        }
    }

    gotoCart() {
        this[NavigationMixin.Navigate]({
            type: "standard__recordPage",
            attributes: {
                recordId: this.cartId,
                objectApiName: "WebCart",
                actionName: "view",
            },
        });
    }
}