

import { LightningElement, api, track } from "lwc";

export default class ProductConfiguratorInput extends LightningElement {
  @api field = {};

  @track disabled = true;

  get filters() {
    return [
      { value: "", label: "Select an Option" },
      ...(this.field.options || []).map((value) => ({
        value,
        label: value
      }))
    ];
  }

  handleFilterChange(event) {
    const value = event.target.value;
    const changeEvent = new CustomEvent("filterchange", {
      detail: {
        value,
        name: this.field.name,
      }
    });

    this.dispatchEvent(changeEvent);
  }
}
