

//Base imports
import { LightningElement, track, api, wire } from "lwc";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import applyCoupon from "@salesforce/apex/CouponController.applyCoupon";
import getActiveAppliedCoupons from "@salesforce/apex/CouponController.getActiveAppliedCoupons";

//Subscribe to change event
import { publish, MessageContext, subscribe } from "lightning/messageService";
import messageChannel from "@salesforce/messageChannel/lightning__commerce_cartChanged";

export default class Coupon extends LightningElement {
	@api recordId;

	couponCode = "";

	validCouponMsg = "Valid Coupon";
	maxLength = 20;
	invalidInput = true;
	hasServerError = false;

	@track clientErrorMessage;
	@track serverErrorMessage;
	@track appliedCouponsList = [];

	//Subscription to change event
	subscription = null;
	@wire(MessageContext) messageContext;

	subscribeToCartChangeMessageService() {
		console.log("SUBSCRIPTION HANDLED");

		if (this.subscription) {
			return;
		}

		this.subscription = subscribe(
			this.messageContext,
			messageChannel,
			message => {
				console.log("SUBSCRIPTION CALLBACK FIRED");

				const coupons = this.appliedCouponsList.map(
					item => item.Coupon__r.Coupon_Code__c
				);
				if (coupons.length > 0 && !this.hasServerError) {
					this.appliedCouponsList = [];
					this.serverErrorMessage =
						"Removed " +
						coupons.length +
						(coupons.length > 1 ? " coupons (" : " coupon (") +
						coupons.join(", ") +
						") due to change in cart.";
					this.hasServerError = true;
					this.dispatchEvent(
						new CustomEvent("cartchanged", {
							bubbles: true,
							composed: true,
						})
					);
				}
			}
		);
	}

	async connectedCallback() {
		this.subscribeToCartChangeMessageService();

		getActiveAppliedCoupons({ cartId: this.recordId })
			.then(result => {
				this.appliedCouponsList = result;
				console.log(result, "applied");
			})
			.catch(error => {
				auraExceptionHandler.logAuraException(error);
			});
	}

	validateInput(event) {
		this.invalidInput = event.target.value.length <= 0;
		this.couponCode = event.target.value;
	}

	applyCoupon() {
		applyCoupon({ couponCode: this.couponCode })
			.then(res => {
				this.handleSuccess(res);
			})
			.catch(error => {
				auraExceptionHandler.logAuraException(error);
			});
	}

	handleSuccess(res) {
		if (this.validCouponMsg !== res.validationMessage) {
			this.hasServerError = true;
			this.serverErrorMessage = res.validationMessage;
		} else {
			this.couponCode = "";
			this.hasServerError = false;
			this.serverErrorMessage = "";
			let appliedCoupon = {
				Id: res.coupon.Id,
				Coupon__r: {
					Coupon_Notes__c: res.coupon.Coupon_Notes__c,
					Coupon_Code__c: res.coupon.Coupon_Code__c,
				},
			};

			this.appliedCouponsList = [
				...this.appliedCouponsList,
				appliedCoupon,
			];

			this.dispatchEvent(
				new CustomEvent("cartchanged", {
					bubbles: true,
					composed: true,
				})
			);
		}
	}
}
