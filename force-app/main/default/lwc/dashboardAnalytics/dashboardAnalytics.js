

import { LightningElement } from "lwc";
import fetchMAPFundsData from "@salesforce/apex/DashboardAnalyticsController.getMAPFundsData";
import fetchAvailableMAPFunds from "@salesforce/apex/DashboardAnalyticsController.getAvailableMAPFunds";
import fetchMAPFundsUsed from "@salesforce/apex/DashboardAnalyticsController.getMAPFundsUsed";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import {ContextProvider} from "c/communityContextProvider";

export default class DashboardAnalytics extends ContextProvider(LightningElement) {
    currentYear = new Date().getFullYear();
    fundsUsed = 0;

    fundsRedeemed;
    availableFunds;
    expirationDate;

    loadedData = false;

    get fundsForTheYear() {
        return this.fundsRedeemed + this.fundsUsed;
    }

    connectedCallback() {
        fetchMAPFundsData({
          ctx: this.communityContext,
        })
            .then(result => {
                console.log(result, 'curFunds');
                this.fundsRedeemed = result[0].MAP_Funds__c;
                this.expirationDate = result[0].MAP_Expiration_Date__c;
            })
            .catch(error => auraExceptionHandler.logAuraException(error));
        fetchAvailableMAPFunds({
          ctx: this.communityContext,
        })
            .then(result => {
                console.log(result, 'available');
                this.availableFunds = result;
            })
            .catch(error => auraExceptionHandler.logAuraException(error));
        fetchMAPFundsUsed()
          .then(result => {
              console.log(result, 'mapFundsUsed');
              this.fundsUsed = result;
              this.loadedData = true;
          })
          .catch(error => auraExceptionHandler.logAuraException(error));
    }

    startFlow() {
        const startFlowEvent = new CustomEvent('startflow');
        this.dispatchEvent(startFlowEvent);
    }
}
