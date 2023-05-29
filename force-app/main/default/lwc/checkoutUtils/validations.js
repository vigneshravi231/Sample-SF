
const always = () => true;

export const generalScreenValidation = {
	paymentOption: {
		name: "Payment Method is Required",
		message: "Select a payment method",
		shouldRun: always,
		isValid: state => !!state.selection.paymentOption,
	},
	poNumber: {
		name: "Purchase Order Number is Required",
		message: "Purchase Order Number is required",
		shouldRun: always,
		// if cant place order, means its requisitioner and does not need to enter PO
		isValid: state => !!state.selection.poNumber || state.checkoutPermissions.canCheckoutWithoutPoNumber
	},
	shipping: {
		name: "Shipping Address Id Null",
		message: "Shipping address is required",
		shouldRun: state => !state.selection.isLineLevelShipping,
		isValid: state => !!state.selection.shipTo,
	},
	lineLevelShipping: {
		name: "Cart Item(s) Missing Shipping_Address__c",
		message: "Shipping Address required for each line item",
		shouldRun: state => state.selection.isLineLevelShipping,
		isValid: state => {
			const validateLines = lines => lines.every(line => line.ShippingAddress?.Id);
			const allMainItemsValid = validateLines(state.cartItems);
			const allSplitsValid = state.cartItems.every(item => validateLines(item.splitItems));

			return allMainItemsValid && allSplitsValid;
		},
	},
	billing: {
		name: "Billing Address Id Null",
		message: "Billing address is required",
		shouldRun: always,
		isValid: state => !!state.selection.billTo,
	},
	instructions: {
		name: "Delivery Instructions must be alphanumeric",
		message: "Delivery Instructions must be alphanumeric",
		shouldRun: always,
		isValid: state => /^[\w\s]*$/g.test(state.selection.deliveryInstructions)
	},
};

export const shippingScreenValidation = {
	deliveryMethod: {
		name: "Order Delivery Method is Null",
		message: state => (state.simulateSplit.length > 1 ? "Select a Shipping Option for each location" : "Select Shipping Option"),
		shouldRun: always,
		isValid: state => {
			return state.simulateSplit.every(split => !!state.selection.bySplit[split.splitKey]?.deliveryMethodId);
		},
	},
};

export const validate = (state, validations) => {
	const isInvalid = validation => validation.shouldRun(state) && !validation.isValid(state);
	const isFn = maybeFn => typeof maybeFn === "function";

	const getMessage = (validation) => isFn(validation.message)
		? validation.message(state)
		: validation.message;

	return Object.values(validations).reduce((errors, validation) => {
		return isInvalid(validation) ? [...errors, { name: validation.name, message: getMessage(validation) }] : [...errors];
	}, []);
};
