


import { LightningElement, api } from "lwc";
import { Redux } from "c/lwcRedux";
import { checkout } from "c/reduxStore";
import { logProxy } from "c/utils";

export default class AddOneTimeShippingAddress extends Redux(LightningElement) {

  @api item;
  isSplitItem;
  showOneTimeShippingForm;
  validOneTimeShippingForm;
  isPart;

  get disableOneTimeShipSubmit() {
    return !this.validOneTimeShippingForm;
  }

  mapStateToProps(state) {
    return {
      cart: state.checkout.cart,
      cartItems: state.checkout.cartItems,
      addresses: state.checkout.addresses,
      isLineLevelShipping: state.checkout.selection.isLineLevelShipping,
      partClassToOrderTypeMapping: state.checkout.partClassToOrderTypeMapping
    };
  }

  mapDispatchToProps() {
    return {
      updateSplit: checkout.actions.updateSplit,
      updateItem: checkout.actions.updateItem
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.isPart = this.props?.partClassToOrderTypeMapping[this.item?.Parts_Class__c] === 'Parts';
    this.isSplitItem = this.item.splitItem;
  }

  addOneTimeAddress() {
    this.template
      .querySelector("c-one-time-shipping-form")
      .addOneTimeShippingAddress();
  }

  openOneTimeShipping() {
    this.showOneTimeShippingForm = true;
  }

  hideOneTimeShippingForm() {
    this.showOneTimeShippingForm = false;
  }

  handleNewOneTimeShippingAddress(event) {
    this.showOneTimeShippingForm = false;

    const diff = {
      ShippingAddress: event.detail
    };

    if (this.isSplitItem) {
      let itemId = this.item.SplitFromId;
      let splitId = this.item.UniqueId;
      this.props.updateSplit({ itemId, splitId, diff });
    } else {
      let itemId = this.item.Id;
      this.props.updateItem({ itemId, diff });
    }

  }

  handleOneTimeShippingValidation(event) {
    this.validOneTimeShippingForm = event.detail;
  }

  closeShipToModal() {
    this.showOneTimeShippingForm = false;
  }
}