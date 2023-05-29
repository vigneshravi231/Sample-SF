

import { api, LightningElement, track } from "lwc";
import { Redux } from "c/lwcRedux";
import { groupBy, logProxy } from "c/utils";
import { checkout } from "c/reduxStore";

export default class CoAddresses extends Redux(LightningElement) {
  @track showBillToModal = false;
  @track showShipToModal = false;
  @track showAddAddressModal = false;
  partsOnly = false;
  showOneTimeShippingForm = false;
  validOneTimeShippingForm = false;

  get disableOneTimeShipSubmit() {
    return !this.validOneTimeShippingForm;
  }

  connectedCallback() {
    super.connectedCallback();
    this.doDefaultAddressSelection();
    this.partsOnly = this.props.partsOnly;
  }

  doDefaultAddressSelection() {
    if (!this.props.billTo.Id) {
      this.props.makeSelection({
        field: "billTo",
        value: this.defaultBillingAddress
      });
    }

    if (!this.props.shipTo.Id) {
      this.props.makeSelection({
        field: "shipTo",
        value: this.defaultShippingAddress
      });
    }
  }

  mapStateToProps(state) {
    return {
      cart: state.checkout.cart,
      addresses: state.checkout.addresses,
      isLineLevelShipping: state.checkout.selection.isLineLevelShipping,
      deliveryInstructions: state.checkout.selection.deliveryInstructions,
      billTo: state.checkout.selection.billTo,
      shipTo: state.checkout.selection.shipTo,
      partClassToOrderTypeMapping: state.checkout.partClassToOrderTypeMapping,
      partsOnly: state.checkout.partsOnly,
      buyerAccount: state.checkout.buyerAccount,
    };
  }

  mapDispatchToProps() {
    return {
      makeSelection: checkout.actions.makeCartSelection,
      addAddress: checkout.actions.addAddress
    };
  }

  get billingAddresses() {
    return groupBy(this.props.addresses, "AddressType")["Billing"] || [];
  }

  get hasBillingAddresses() {
    return this.billingAddresses.length > 0;
  }

  get shippingAddresses() {
    return groupBy(this.props.addresses, "AddressType")["Shipping"] || [];
  }

  get hasShippingAddresses() {
    return this.shippingAddresses.length > 0;
  }

  get defaultShippingAddress() {
    return (
      this.shippingAddresses.find((address) => address.IsDefault) ||
      this.shippingAddresses[0]
    );
  }

  get defaultBillingAddress() {
    return (
      this.billingAddresses.find((address) => address.IsDefault) ||
      this.billingAddresses[0]
    );
  }

  openShipToModal() {
    this.showShipToModal = true;
  }

  closeShipToModal() {
    this.showShipToModal = false;
  }

  openBillToModal() {
    this.showBillToModal = true;
  }

  closeBillToModal() {
    this.showBillToModal = false;
  }

  hideOneTimeShippingForm() {
    this.showOneTimeShippingForm = false;
  }

  @api showAddressModal() {
    this.showAddAddressModal = true;
  }

  closeAddAddressModal() {
    this.showAddAddressModal = false;
  }

  addAddress() {
    this.template
      .querySelector("c-add-contact-point-address-form")
      .upsertAddress();
  }

  addOneTimeAddress() {
    this.template
      .querySelector("c-one-time-shipping-form")
      .addOneTimeShippingAddress();
  }

  showOneTimeShipping() {
    this.showOneTimeShippingForm = true;
  }

  handleDeliveryInstructions(event) {
    this.props.makeSelection({
      field: "deliveryInstructions",
      value: event.target.value
    });
  }

  handleAddressSelection(event) {
    const { type, address } = event.detail;

    const field = type === "Billing" ? "billTo" : "shipTo";

    this.props.makeSelection({
      field,
      value: address
    });

    this.showBillToModal = false;
    this.showShipToModal = false;
  }

  handleAddressAdded(event) {
    const { raw: address } = event.detail;

    this.props.addAddress(address);
    this.doDefaultAddressSelection();
    this.showAddAddressModal = false;
  }

  handleOneTimeShippingValidation(event) {
    this.validOneTimeShippingForm = event.detail;
  }

  handleNewOneTimeShippingAddress(event) {
    this.showOneTimeShippingForm = false;
    this.shippingAddresses = this.props.addresses;
  }
}
