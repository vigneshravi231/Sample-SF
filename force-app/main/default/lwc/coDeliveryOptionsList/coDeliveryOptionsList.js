
import { LightningElement, api } from "lwc";
import { Redux } from "c/lwcRedux";

export default class CoDeliveryOptionsList extends Redux(LightningElement) {
	@api options;
	@api selections;
	@api splitKey;
	@api orderType;

	filteredOptions = [];

	mapStateToProps(state) {
		return {
			deliveryMethods: state.checkout.orderDeliveryMethods
		};
	}

	get splitSelection(){
		return this.selections[this.splitKey] || {};
	}

	get shipOrderComplete(){
		return this.splitSelection.shipOrderComplete === undefined
			? true
			: this.splitSelection.shipOrderComplete;
	}

	connectedCallback() {
		super.connectedCallback();
		this.filterOptions();
	}

	filterOptions() {
		this.filteredOptions = this.props.deliveryMethods
			.reduce((acc, method) =>  method.Order_Type__c.split(';').includes(this.orderType)
			? acc.concat({value: method.Id, label: method.Name})
			: acc ,[]);
	}

	handleShippingOptionSelect(event) {
		let methodId = event.target.value;

		this.dispatchEvent(
			new CustomEvent("select", {
				detail: { methodId, splitKey: this.splitKey },
				bubbles: true,
				composed: true,
			})
		);
	}

	handleShippingAccountNumberChange(event){
		this.dispatchEvent(
			new CustomEvent("accountnumberchange", {
				detail: { accountNumber: event.target.value, splitKey: this.splitKey },
				bubbles: true,
				composed: true,
			})
		);
	}

	handleShipOrderCompleteChange(event){
		const checked = event.target.checked;
		this.dispatchEvent(
			new CustomEvent("shipordercompletechange", {
				detail: { shipOrderComplete: checked, splitKey: this.splitKey },
				bubbles: true,
				composed: true,
			})
		);
	}

}
