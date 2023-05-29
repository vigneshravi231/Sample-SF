

import { api, LightningElement, track, wire } from 'lwc';

import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import ORDER_SUMMARY_NUMBER from '@salesforce/schema/OrderSummary.OrderNumber';
import ORIGINAL_ORDER_ID from '@salesforce/schema/OrderSummary.OriginalOrderId';
import approveOrder from '@salesforce/apex/OrderSummaryController.approveOrder';
import rejectOrder from '@salesforce/apex/OrderSummaryController.rejectOrder';
import canApproveOrReject from '@salesforce/apex/OrderSummaryController.canApproveOrReject';
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class OrderSummaryDetailHeader extends LightningElement {

    @api recordId;

    @track showButtons = false;
    showConfirmation = false;
    approve = false;

    orderId;

    @wire(getRecord, {
        recordId: '$recordId',
        fields: [ORDER_SUMMARY_NUMBER, ORIGINAL_ORDER_ID],
    })
    orderSummary({ error, data }) {
       if(data) {
            this.orderId = data.fields?.OriginalOrderId?.value;
            canApproveOrReject({ orderId: data.fields?.OriginalOrderId?.value })
              .then(result => {
                  this.showButtons = result;
              })
              .catch(err => auraExceptionHandler.logAuraException(err));
        } else if(error) {
            auraExceptionHandler.logAuraException(error);
        }
    };

    get number() {
        return getFieldValue(this.orderSummary.data, ORDER_SUMMARY_NUMBER);
    }

    get orderActionText() {
        return this.approve ? 'approve' : 'reject'
    }

    get orderActionHeaderText() {
        return this.approve ? 'Approve' : 'Reject'
    }

    approveOrder() {
        this.showConfirmation = true;
        this.approve = true;
    }

    rejectOrder() {
        this.showConfirmation = true;
        this.approve = false;
    }

    closeConfirmation() {
        this.showConfirmation = false;
    }

    finalizeOrder() {
        console.log(this.orderId, 'test');
        if(this.approve) {
            approveOrder({ orderId: this.orderId })
              .then(result => {
                  this.showToast('This order has been approved.', null, 'success');
                  this.showButtons = false;
              })
              .catch(error => {
                  this.showToast('An error has occurred.', 'Please contact your Salesforce administrator.', 'error');
                  auraExceptionHandler.logAuraException(error);
              })
              .finally(() => {
                  this.closeConfirmation();
              });
        } else {
            rejectOrder({ orderId: this.orderId })
              .then(result => {
                  this.showToast('This order has been rejected.', null, 'success');
                  this.showButtons = false;
              })
              .catch(error => {
                  this.showToast('An error has occurred.', 'Please contact your Salesforce administrator.', 'error');
                  auraExceptionHandler.logAuraException(error);
              })
              .finally(() => {
                  this.closeConfirmation();
              });
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }
}
