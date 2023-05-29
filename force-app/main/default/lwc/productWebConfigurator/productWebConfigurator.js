
import { api, track, wire, LightningElement } from "lwc";

import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";

// LMS
import { publish, MessageContext } from "lightning/messageService";
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";

// apex methods
import initializeConfiguration from "@salesforce/apex/ProductWebConfiguratorCtrl.fetchConfiguratorSetupData";
import addToCart from "@salesforce/apex/ProductWebConfiguratorCtrl.addToCart";

import {ContextProvider} from "c/communityContextProvider";

export default class ProductWebConfigurator extends NavigationMixin(ContextProvider(LightningElement)) {
	@wire(MessageContext)
	messageContext;

	@api recordId;
	@api configurationType;
	@api title;
	@api smartString;
	@api inventoryId;
	@api quantity;

	@track
	isLoading = false;

	@track
	configurationID = null;

	@track
	iframeUrl = null;

	_listener = null;
	_storageKey;

	@api
	removeCachedConfigurationID() {
		localStorage.removeItem(this._storageKey);
	}

	@api
	async addToCart({successMessage}){
		this.isLoading = true;

		try {
			const input = {
				quantity: this.quantity,
				configurationID: this.configurationID,
				inventoryID: this.inventoryId,
				configurationType: this.configurationType,
				smartString: this.smartString,
			}
			const cartID = await addToCart({
				ctx: this.communityContext,
				input
			});

			const toast = new ShowToastEvent({
				title: "Add To Cart",
				message: successMessage,
				variant: "success"
			});
			this.dispatchEvent(toast);

			publish(this.messageContext, cartChanged);

			this.removeCachedConfigurationID();
			this.clearCache();
			this.navigateToCart(cartID);
		}
		catch(err){
			const toast = new ShowToastEvent({
				title: "Add To Cart",
				variant: "error",
				message: err?.body?.message ?? "Unable to add to cart",
			});
			this.dispatchEvent(toast)
		}
		finally {
			this.isLoading = false;
		}
	}

	async connectedCallback() {
		const suffix = !!this.smartString ? `_${this.smartString}` : "";
		const effectiveAccountID = this.communityContext.effectiveAccountId || '';

		this._storageKey = `webconfigurator_config_id_${this.configurationType}${suffix}${effectiveAccountID}`;
		this.subscribeToIframeEvents();

		this.isLoading = true;

		try {
			const input = {
				configurationID: this.getCachedConfigurationID(),
				configurationType: this.configurationType,
				smartString: this.smartString,
			};

			const res = await initializeConfiguration({
				ctx: this.communityContext,
				input,
			});

			console.log(JSON.parse(JSON.stringify(res)));

			if (res.success) {
				this.configurationID = res.config_id;
				this.iframeUrl = res.iframeUrl;
				this.cacheConfigurationID(this.configurationID);
				this.dispatchEvent(new CustomEvent("load", { detail: { configurationID: this.configurationID } }));
			}
		}
		catch(err){
			auraExceptionHandler.logAuraException(err);
		}
		finally {
			this.isLoading = false;
		}
	}

	disconnectedCallback() {
		window.removeEventListener("message", this._listener);
	}

	get hasConfigurationID() {
		return !!this.configurationID;
	}

	subscribeToIframeEvents() {
		this._listener = this.iframeEventHandler.bind(this);

		window.addEventListener("message", this._listener, false);
	}

	async iframeEventHandler(event) {
		const action = event.data || "cancel";

		const detail = {
			configurationID: this.configurationID,
			configurationType: this.configurationType,
		};

		const actions = {
			submit: () => this.dispatchEvent(new CustomEvent("submit", { detail })),
			cancel: () => this.dispatchEvent(new CustomEvent("cancel", { detail })),
		};

		actions[action]();
	}

	getCachedConfigurationID() {
		return localStorage.getItem(this._storageKey) || null;
	}


	cacheConfigurationID(configID) {
		localStorage.setItem(this._storageKey, configID);
	}

	clearCache(){
		localStorage.clear();
	}


	navigateToCart(cartID){
		this[NavigationMixin.Navigate]({
			type: "standard__recordPage",
			attributes: {
				recordId: cartID,
				objectApiName: "WebCart",
				actionName: "view",
			}
		});
	}
}
