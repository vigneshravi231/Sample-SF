

import { LightningElement, track } from "lwc";
import { Redux } from "c/lwcRedux";
import { checkout } from "c/reduxStore";

import labels from "c/coLabels";

export default class CoPaymentOptions extends Redux(LightningElement) {
  @track isLoading = false;

  labels = labels;

  mapStateToProps(state) {
    return {
      cart: state.checkout.cart,
      netTerms: state.checkout.netTerms,
      poNumber: state.checkout.selection.poNumber,
      paymentOption: state.checkout.selection.paymentOption,
      errors: state.checkout.errors,
      isCreditCardOnFileAvailable: state.checkout.isCreditCardOnFileAvailable,
      paymentTypes: state.checkout.paymentTypes,
      canCheckoutWithoutPoNumber: state.checkout.checkoutPermissions.canCheckoutWithoutPoNumber
    };
  }

  mapDispatchToProps() {
    return {
      makeCartSelection: checkout.actions.makeCartSelection
    };
  }

  get poNumberPlaceholder() {
    return this.props.canCheckoutWithoutPoNumber
      ? labels.PurchaseOrderNumberRequisitionerPlaceholder
      : labels.PurchaseOrderNumberPlaceholder;
  }

  get isPoNumberRequired() {
    return !(this.props.canCheckoutWithoutPoNumber || this.props.paymentOption === 'CIACreditCard');
  }

  get errors() {
    return this.props.errors || {};
  }

  dispatchPoNumberSelection(value) {
    this.props.makeCartSelection({
      field: "poNumber",
      value
    });
  }

  dispatchPaymentOptionSelection(value) {
    this.props.makeCartSelection({
      field: "paymentOption",
      value
    });
  }

  get hasPaymentMethod() {
    return this.options.length > 0;
  }

  get options() {
    let options = [];

    if (Object.keys(this.props.netTerms).length) {
      options.push({
        label: `Use ${this.props.netTerms.Name}`,
        value: "netTerms"
      });
    }

    if (this.props.paymentTypes?.length > 0) {
      options = [...options, ...this.props.paymentTypes.reduce((all, item) => {
        const isCreditCard = item === "CIA - Credit Card" || item === "CC";

        if (isCreditCard) {
          const label = "Use Credit Card on File";

          return this.props.isCreditCardOnFileAvailable
            ? [...all, {
              label,
              value: "CC"
            }]
            : [...all];
        }

        return [...all, {
          label: item,
          value: item.replaceAll(/[^a-zA-Z0-9]+/g, "")
        }];
      }, [])];
      console.log(JSON.parse(JSON.stringify(options)), "options");
    }

    return options;
  }

  createOptionsElement(label, value) {
    return {
      label,
      value
    };
  }

  handlePaymentMethodSelection(event) {
    const isValidPaymentMethod = this.options.map(item => item.value?.replaceAll(/[^a-zA-Z0-9]+/g, ""))
      .includes(event.target.value);//['ccOnFile', 'netTerms'].includes(event.target.value);

    if (isValidPaymentMethod) {
      this.dispatchPaymentOptionSelection(event.target.value);
    }
  }

  handlePoNumberChange(event) {
    this.dispatchPoNumberSelection(event.target.value);
  }
}
