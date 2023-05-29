

import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";

export default class CodeOfConductButton extends NavigationMixin(
  LightningElement
) {
  viewPDF() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url:
          "https://ffdev-Sampleability.cs67.force.com/customercareplus/sfc/servlet.shepherd/document/download/0690n000000i5szAAA?operationContext=S1"
      }
    });
  }
}
