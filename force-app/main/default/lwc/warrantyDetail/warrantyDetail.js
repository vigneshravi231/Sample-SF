

import { LightningElement, api, track } from "lwc";
import previewWarrantyPDFs from "@salesforce/apex/WarrantyDetailController.previewWarrantyPDFs";
import downloadWarrantyPDFs from "@salesforce/apex/WarrantyDetailController.downloadWarrantyPDFs";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { auraExceptionHandler } from "c/auraExceptionHandler";

export default class WarrantyDetail extends NavigationMixin(LightningElement) {
  @api recordId;
  previewLink;

  @track recordIsLoading = true;
  @track previewIsLoading;
  @track downloadIsLoading;

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
    previewWarrantyPDFs({ entitlementIds: [this.recordId] })
      .then((res) => {
        this.previewLink = res;
        this.previewIsLoading = false;
      })
      .catch((error) => {
        auraExceptionHandler.logAuraException(error);
        this.previewHasError = true;
        this.previewIsLoading = false;
      });
  }

  handleLoadSuccess() {
    this.recordIsLoading = false;
  }

  handleLoadError() {
    this.recordIsLoading = false;
    this.fireToastEvent(
      "Error getting this record.",
      "Please contact your Salesforce administrator.",
      "error"
    );
  }

  previewPDF() {
    this[NavigationMixin.Navigate]({
      type: "standard__webPage",
      attributes: {
        url: this.previewLink
      }
    });
  }

  downloadPDF() {
    this.downloadIsLoading = true;
    downloadWarrantyPDFs({ entitlementIds: [this.recordId] })
      .then((res) => {
        console.log(res, "download");
        this[NavigationMixin.Navigate]({
          type: "standard__webPage",
          attributes: {
            url: res
          }
        });
        this.downloadIsLoading = false;
      })
      .catch((error) => {
        auraExceptionHandler.logAuraException(error);
        this.downloadIsLoading = false;
        this.fireToastEvent(
          "Something went wrong with the download.",
          "Please try again later.",
          "error"
        );
      });
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
