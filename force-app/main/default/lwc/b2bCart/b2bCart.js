


import { api, LightningElement, track, wire } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import fetchCart from '@salesforce/apex/CartController.fetchCartSummary';

import {ContextProvider} from "c/communityContextProvider";

import { subscribe, MessageContext, APPLICATION_SCOPE, unsubscribe } from "lightning/messageService";
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";

export default class B2BCart extends ContextProvider(LightningElement) {
  @api recordId;

  @track cartSummary;

  currencyIsoCode;
  hasCartItems;
  showSpinner;

  @wire(MessageContext)
  messageContext;

  _subscription = null

  async connectedCallback() {
    this.subscribeToCartChange();
    this.showSpinner = true;
    this.fetchCart();
  }

  disconnectedCallback() {
    this.unsubscribeToCartChange();
  }

  subscribeToCartChange(){
    if(!this._subscription){
      this._subscription = subscribe(
        this.messageContext,
        cartChanged,
        this.fetchCart.bind(this),
        {}
      )
    }
  }

  unsubscribeToCartChange(){
    unsubscribe(this._subscription);
    this._subscription = null;
  }

  fetchCart() {
    fetchCart({
      ctx: this.communityContext,
      recordId : this.recordId
    })
      .then(res => {
        this.cartSummary = res;
        this.currencyIsoCode = res.currencyIsoCode;
        this.hasCartItems = this.cartSummary?.uniqueProductCount !== 0;
        this.showSpinner = false;
      })
      .catch(error => {
        auraExceptionHandler.logAuraException(error);
        this.cartSummary = {
          totalProductCount: 0
        };
        this.showSpinner = false;
      });
  }
}
