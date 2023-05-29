

import { api, LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { Redux } from "c/lwcRedux";
import { checkout } from "c/reduxStore";
import { validate as validateCheckout, generalScreenValidation } from "c/checkoutUtils";
import { logProxy } from "c/utils";

export default class CoSummary extends NavigationMixin(
  Redux(LightningElement)
) {

  mapStateToProps(state) {
    return {
      cart: state.checkout.cart,
      termsAccepted: state.checkout.selection.termsAccepted,
      state: state.checkout,
    };
  }

  mapDispatchToProps() {
    return {
      makeSelection: checkout.actions.makeCartSelection
    };
  }

  get showErrors(){
    return this.props.termsAccepted && this.hasErrors
  }

  get hasErrors() {
    return this.errors.length > 0;
  }

  get errors() {
    return validateCheckout(this.props.state, generalScreenValidation);
  }

  handleTermsAccept(event) {
    const checked = event.target.checked;
    this.props.makeSelection({ field: "termsAccepted", value: checked });
  }

  get grandTotalWithShipping() {
    return (
      this.props.cart.TotalShippingAmount
        ? this.props.cart.GrandTotalAmount + this.props.cart.TotalShippingAmount
        : this.props.cart.GrandTotalAmount
    );
  }

  get disablePlaceOrder(){
    return !this.props.termsAccepted || this.hasErrors;
  }

  gotoTermsPage() {
    // this[NavigationMixin.GenerateUrl]({
    //   type: "comm__namedPage",
    //   attributes: {
    //     name: "Terms_and_Conditions__c"
    //   }
    // }).then(url => {
    //   window.open(url, "_blank");
    // });
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: "https://www.Sampleability.com/us/en/terms-and-conditions.html"
      }
    })
  }

  confirmOrder() {
    this.dispatchEvent(new CustomEvent('orderconfirmed'));
  }
}
