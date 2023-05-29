import { LightningElement, api, wire } from "lwc";
import { NavigationMixin, CurrentPageReference } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import productSearch from "@salesforce/apex/ProductController.connectApiSearch";
import fetchCartSummary from "@salesforce/apex/CartController.fetchSummary";
import addToCart from "@salesforce/apex/CartController.addToCart";

import { transformData } from "./dataNormalizer";
import { auraExceptionHandler } from "c/auraExceptionHandler";

import { publish, MessageContext } from "lightning/messageService";
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";
import {ContextProvider} from "c/communityContextProvider";

export default class SearchResults extends NavigationMixin(ContextProvider(LightningElement)) {

	@wire(MessageContext)
	messageContext

	@wire(CurrentPageReference)
	pageReference

	@api
	get recordId() {
		return this._recordId;
	}
	set recordId(value) {
		this._recordId = value;
		this._landingRecordId = value;
		this.triggerProductSearch();
	}

	@api
	get term() {
		return this._term;
	}
	set term(value) {
		this._term = value;
		if (value) {
			this.triggerProductSearch();
		}
	}

	@api
	get cardContentMapping() {
		return this._cardContentMapping;
	}
	set cardContentMapping(value) {
		this._cardContentMapping = value;
	}

	@api
	resultsLayout;

	@api
	showProductImage;

	@api
	effectiveAccountId;

	get ctx(){
		return this.querySelector('c-community-context-provider').communityContext();
	}

	triggerProductSearch() {
		const searchQuery = JSON.stringify({
			searchTerm: this.term,
			categoryId: this.recordId,
			refinements: this._refinements,
			page: this._pageNumber - 1,
			includePrices: true,
		});

		this._isLoading = true;

		productSearch({ ctx: this.communityContext, searchQuery })
			.then(result => {
				this.displayData = {
					...result,
					productsPage: {
						...result.productsPage,
						products: result.productsPage.products.map(product => {
							return {
								...product,
								defaultImage: {
									...product.defaultImage,
									url: product.fields.Photo_URL__c?.value || product.defaultImage.url,
								},
							};
						}),
					},
				};
				this._isLoading = false;
				console.log(result);
			})
			.catch(error => {
				this.error = error;
				this._isLoading = false;
				console.log(error);
			});
	}

	get config() {
		return {
			layoutConfig: {
				resultsLayout: this.resultsLayout,
				cardConfig: {
					showImage: this.showProductImage,
					resultsLayout: this.resultsLayout,
					actionDisabled: false, // TODO: this.isCartLocked
				},
			},
		};
	}

	get isPartsPage(){
		return this.pageReference?.state?.categoryPath === 'parts';
	}

	get displayData() {
		return this._displayData || {};
	}
	set displayData(data) {
		this._displayData = transformData(data, this._cardContentMapping);
	}

	get isLoading() {
		return this._isLoading;
	}

	get hasMorePages() {
		return this.displayData.total > this.displayData.pageSize;
	}

	get pageNumber() {
		return this._pageNumber;
	}

	get headerText() {
		let text = "";
		const totalItemCount = this.displayData.total;
		const pageSize = this.displayData.pageSize;

		if (totalItemCount > 1) {
			const startIndex = (this._pageNumber - 1) * pageSize + 1;

			const endIndex = Math.min(startIndex + pageSize - 1, totalItemCount);

			text = `${startIndex} - ${endIndex} of ${totalItemCount} Items`;
		} else if (totalItemCount === 1) {
			text = "1 Result";
		}

		if(!!this.term && !!text){
			text += ` for "${this.term}"`
		}

		return text;
	}

	get isCartLocked() {
		const cartStatus = (this._cartSummary || {}).status;
		return cartStatus === "Processing" || cartStatus === "Checkout";
	}

	async connectedCallback() {
		this._isLoading = true;

		try {
			this._cartSummary = await fetchCartSummary();
		} catch (err) {
			auraExceptionHandler.logAuraException(err);
		} finally {
			this._isLoading = false;
		}
	}

	handlePartReplacementSearch(event){
		const {partNumber} = event.detail;
		this.term = partNumber;
	}

	async handleAction(event) {
		event.stopPropagation();

		const productID = event.detail.productId;
		const quantity = event.detail.quantity;

		const newLines = [{
			sfid: productID,
			quantity: quantity,
		}];

		console.log(JSON.parse(JSON.stringify(newLines)));

		this._isLoading = true;

		try {
			const res = await addToCart({
              	ctx: this.communityContext,
				newLines,
			});
			console.log(JSON.parse(JSON.stringify(res)));

			this.dispatchEvent(
				new ShowToastEvent({
					title: "Success",
					message: "Your cart has been updated.",
					variant: "success",
					mode: "dismissable",
				})
			);

			publish(this.messageContext, cartChanged);

		} catch (err) {
			auraExceptionHandler.logAuraException(err);

			this.dispatchEvent(
				new ShowToastEvent({
					title: "Error",
					message: "{0} could not be added to your cart at this time. Please try again later.",
					messageData: [event.detail.productName],
					variant: "error",
					mode: "dismissable",
				})
			);
		} finally {
			this._isLoading = false;
		}
	}

	handleClearAll() {
		this._refinements = [];
		this._recordId = this._landingRecordId;
		this._pageNumber = 1;
		this.template.querySelector("c-search-filter").clearAll();
		this.triggerProductSearch();
	}

	handleShowDetail(evt) {
		evt.stopPropagation();

		this[NavigationMixin.Navigate]({
			type: "standard__recordPage",
			attributes: {
				recordId: evt.detail.productId,
				actionName: "view",
			},
		});
	}

	handlePreviousPage(evt) {
		evt.stopPropagation();

		this._pageNumber = this._pageNumber - 1;
		this.triggerProductSearch();
	}

	handleNextPage(evt) {
		evt.stopPropagation();

		this._pageNumber = this._pageNumber + 1;
		this.triggerProductSearch();
	}

	handleFacetValueUpdate(evt) {
		evt.stopPropagation();

		this._refinements = evt.detail.refinements;
		this._pageNumber = 1;
		this.triggerProductSearch();
	}

	handleCategoryUpdate(evt) {
		evt.stopPropagation();

		this._recordId = evt.detail.categoryId;
		this._pageNumber = 1;
		this.triggerProductSearch();
	}

	_displayData;
	_isLoading = false;
	_pageNumber = 1;
	_refinements = [];
	_term;
	_recordId;
	_landingRecordId;
	_cardContentMapping;
}
