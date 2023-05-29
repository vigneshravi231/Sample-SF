


import {LightningElement, api} from 'lwc';

import { NavigationMixin } from 'lightning/navigation';

export default class ReturnFromCheckout extends NavigationMixin(LightningElement) {

    @api label;
    @api page;
    @api pageType;

    navigate() {

        let navParams = {
            type: "",
            attributes : {},
        }

        if(this.pageType === 'Object') {
            navParams = {
                type: "comm__namedPage",
                attributes: {
                    name: this.page,
                }
            }
        }

        if(this.pageType === 'Go Back') {
            window.history.back();
        }

        this[NavigationMixin.Navigate](navParams);

    }

}