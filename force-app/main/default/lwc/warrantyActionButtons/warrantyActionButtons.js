
import { LightningElement, api, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { sureThing } from "c/utils";

import _previewWarrantyPDFs from "@salesforce/apex/WarrantyDetailController.previewWarrantyPDFs";
import _downloadWarrantyPDFs from "@salesforce/apex/WarrantyDetailController.downloadWarrantyPDFs";

const $previewPdf = sureThing(_previewWarrantyPDFs);
const $downloadPdf = sureThing(_downloadWarrantyPDFs);

// todo: try making this more generic using slots
export default class WarrantyActionButtons extends NavigationMixin(
  LightningElement
) {
  @api warrantyId;

  @track previewIsLoading;
  @track downloadIsLoading;

  previewLink;
  previewHasError;

  get downloadText() {
    return this.downloadIsLoading ? "Downloading..." : "Download as PDF";
  }

  get previewText() {
    return this.previewHasError
      ? "Preview Unavailable"
      : this.previewIsLoading
        ? "Loading Preview..."
        : "Preview PDF";
  }

  get previewUnavailable() {
    return this.previewHasError || this.previewIsLoading;
  }

  async connectedCallback() {
    this.previewIsLoading = true;

    const { ok, error, data } = await $previewPdf({
      entitlementIds: [this.warrantyId]
    });

    if (ok) {
      this.previewLink = data;
    } else {
      this.previewHasError = true;
      auraExceptionHandler.logAuraException(error);
    }
    this.previewIsLoading = false;
  }

  previewPDF() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: this.previewLink
      }
    });
  }

  gotoDetails() {
    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "Warranty_Registration_Detail__c"
      },
      state: {
        recordId: this.warrantyId
      }
    });
  }

  async downloadPDF() {
    this.downloadIsLoading = true;

    const { ok, data, error } = await $downloadPdf({
      entitlementIds: [this.warrantyId]
    });

    if (ok) {
      this[NavigationMixin.Navigate]({
        type: "standard__webPage",
        attributes: {
          url: data
        }
      });
      this.downloadIsLoading = false;
    } else {
      auraExceptionHandler.logAuraException(error);
      this.downloadIsLoading = false;
      this.fireToastEvent(
        "Something went wrong with the download.",
        "Please try again later.",
        "error"
      );
    }
  }

  fireToastEvent(title, message, variant) {
    const evt = new ShowToastEvent({
      title,
      message,
      variant
    });
    this.dispatchEvent(evt);
  }
}
