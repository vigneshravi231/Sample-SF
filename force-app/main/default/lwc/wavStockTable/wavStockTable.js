

import { api, LightningElement } from "lwc";

export default class WavStockTable extends LightningElement {
	@api tableData = [];
	@api buttonLabel;
	@api tableTitle;

	get resultsExist() {
		return this.tableData.length > 0;
	}

	handleRowEvent(event) {
		const { inventoryId, productId } = event.currentTarget.dataset;
		this.dispatchEvent(new CustomEvent("rowevent", { detail: { inventoryId, productId } }));
	}
}
