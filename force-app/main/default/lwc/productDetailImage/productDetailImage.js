

import { api, LightningElement } from "lwc";
import fetchProductDetail from "@salesforce/apex/ProductController.fetchProductDetail";
import { auraExceptionHandler } from "c/auraExceptionHandler";

export default class ProductDetailImage extends LightningElement {
  @api recordId;
  productImage;

  connectedCallback() {
    fetchProductDetail({ productID: this.recordId })
      .then((result) => {
        this.productImage = result.productDetail.imageUrl;
      })
      .catch((error) => auraExceptionHandler.logAuraException(error));
  }
}
