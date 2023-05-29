import { LightningElement, api, track } from 'lwc';

export default class SearchCard extends LightningElement {

    @api
    displayData;

    @api
    config;

    @track quantity = 1;

    get image() {
        return this.displayData.image || {};
    }

    get fields() {
        return (this.displayData.fields || []).map(({ name, value }, id) => ({
            id: id + 1,
            tabIndex: id === 0 ? 0 : -1,
            // making the first field bit larger
            class: id
                ? 'slds-truncate slds-text-heading_small'
                : 'slds-truncate slds-text-heading_medium brand-color',
            // making Name and Description shows up without label
            // Note that these fields are showing with apiName. When builder
            // can save custom JSON, there we can save the display name.
            value:
                name === 'Name' || name === 'Description' || name === 'ProductCode'
                    ? value
                    : `${name}: ${value}`
        }));
    }

    get showImage() {
        return !!(this.config || {}).showImage;
    }

    get actionDisabled() {
        return !!(this.config || {}).actionDisabled || !this.hasPrice;
    }

    get price() {
        const prices = this.displayData.prices;
        return prices.negotiatedPrice || prices.listingPrice;
    }

    get hasPrice() {
        return !!this.price;
    }

    get listingPrice() {
        return this.displayData.prices.listingPrice;
    }

    get canShowListingPrice() {
        const prices = this.displayData.prices;

        return (
            prices.negotiatedPrice &&
            prices.listingPrice &&
            // don't show listing price if it's less than or equal to the negotiated price.
            Number(prices.listingPrice) > Number(prices.negotiatedPrice)
        );
    }

    get currency() {
        return this.displayData.prices.currencyIsoCode;
    }

    get cardContainerClass() {
        return this.config.resultsLayout === 'grid'
            ? 'slds-box card-layout-grid'
            : 'card-layout-list';
    }

    get lowestQuantity() {
        return this.quantity === 1;
    }

    get highestQuantity() {
        return this.quantity === 999;
    }

    handleQuantityChange(event) {
        const qty = Number(event.target.value);
        if(qty < 1) {
            this.quantity = 1;
        } else if(qty > 999) {
            this.quantity = 999;
        } else {
            this.quantity = qty;
        }
    }

    incrementQuantity() {
        if(this.quantity < 9999) {
            this.quantity++;
        }
    }

    decrementQuantity() {
        if(this.quantity > 1) {
            this.quantity--;
        }
    }

    notifyAction() {
        this.dispatchEvent(
            new CustomEvent('calltoaction', {
                bubbles: true,
                composed: true,
                detail: {
                    productId: this.displayData.id,
                    productName: this.displayData.name,
                    quantity: this.quantity
                }
            })
        );
        this.quantity = 1;
    }

    notifyShowDetail(evt) {
        evt.preventDefault();

        this.dispatchEvent(
            new CustomEvent('showdetail', {
                bubbles: true,
                composed: true,
                detail: { productId: this.displayData.id }
            })
        );
    }
}
