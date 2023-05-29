


import { api, LightningElement } from "lwc";

export default class OrderProductSummaries extends LightningElement {

  @api productSummaryList = [];
  @api totalProductAmount;
  @api lineLevelShipping;
  @api deliveryGroupSummary;

  get addressLabel() {
    let g = this.deliveryGroupSummary;
    return `${g.DeliverToStreet} ${g.DeliverToCity} ${g.DeliverToCity}, ${g.DeliverToState} ${g.DeliverToPostalCode} ${g.DeliverToCountry}`
  }

}