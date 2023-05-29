
import { LightningElement, api, wire, track } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import NAME_FIELD from "@salesforce/schema/Product2.Name";
import { CurrentPageReference, NavigationMixin } from "lightning/navigation";

export default class WavConfigurator extends NavigationMixin(LightningElement) {
	@track isLoading = false;
	@api recordId;

	@wire(CurrentPageReference)
	pageReference;

	@wire(getRecord, {
		recordId: "$pageReference.state.productId",
		fields: [NAME_FIELD],
	})
	product;

	async handleCancel() {
		this.webconfigurator.removeCachedConfigurationID();
	}

	async handleSubmit() {
		await this.webconfigurator.addToCart({
			successMessage: "Successfully added configured WAV to cart",
		});
	}

	get webconfigurator() {
		return this.template.querySelector("c-product-web-configurator");
	}

	get canLoadIframe() {
		return !!this.productName && !!this.inventoryId;
	}

	get productName() {
		return getFieldValue(this.product.data, NAME_FIELD);
	}

	get inventoryId() {
		return this.pageReference.state.inventoryId;
	}

	get quantity(){
		return parseInt(this.pageReference.state.quantity) || 1;
	}
}
