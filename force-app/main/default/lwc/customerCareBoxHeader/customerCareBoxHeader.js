


import {LightningElement, api} from 'lwc';

export default class CustomerCareBoxHeader extends LightningElement {

    @api title;
    @api box;

    get sldsBox() {
        if(this.box) {
            return "slds-box slds-m-bottom_medium"
        } else {
            return ""
        }
    }

}