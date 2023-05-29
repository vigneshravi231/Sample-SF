

import { LightningElement, api } from "lwc";

export default class WavConfiguratorTable extends LightningElement {
	@api currentProduct;

	handleChange() {}

	configuration = {
		option: [
			{ value: "option_1", label: "Option 1" },
			{ value: "option_2", label: "Option 2" },
			{ value: "option_3", label: "Option 3" },
			{ value: "option_4", label: "Option 4" },
			{ value: "option_5", label: "Option 5" },
		],
	};
}
