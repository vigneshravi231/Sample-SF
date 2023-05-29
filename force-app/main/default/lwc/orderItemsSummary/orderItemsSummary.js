

import { LightningElement, api } from "lwc";

export default class OrderItemsSummary extends LightningElement {
  @api items;
  @api showImage = false;
  @api hideSubtotal;


  get subtotal() {
    return (this.items || []).reduce(
      (total, item) => total + item.TotalPrice,
      0
    );
  }
}
