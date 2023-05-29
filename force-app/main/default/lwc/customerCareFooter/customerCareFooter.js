

import { LightningElement } from "lwc";
import SampleABILITY_LOGO_WHITE from "@salesforce/resourceUrl/SampleAbilityLogoWhite";
import { NavigationMixin } from "lightning/navigation";

export default class CustomerCareFooter extends NavigationMixin(
  LightningElement
) {
  SampleAbilityLogoUrl = SampleABILITY_LOGO_WHITE;

  navigate(event) {
    const pageName = event.target.dataset.pageName;

    if (pageName) {
      this[NavigationMixin.Navigate]({
        type: "comm__namedPage",
        attributes: {
          name: pageName
        }
      });
    }
  }
}
