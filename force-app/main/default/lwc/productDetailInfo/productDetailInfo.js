


import { api, LightningElement, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from "lightning/messageService";
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { CurrentPageReference, NavigationMixin } from "lightning/navigation";

import fetchProductDetail from "@salesforce/apex/ProductController.fetchProductDetail";
import addToCart from "@salesforce/apex/CartController.addToCart";
import addConvertedWavToCart from "@salesforce/apex/CartController.addConvertedWavToCart";
import { groupBy } from "c/utils";

import {ContextProvider} from "c/communityContextProvider";

const VIN_TYPE_CONVERTED = "Chassis - Converted";
const VIN_TYPE_UNCONVERTED = "Chassis - UnConverted";

export default class ProductDetailInfo extends NavigationMixin(ContextProvider(LightningElement)) {
  @api recordId;
  @api inventoryId;

  @track product;
  @track inventory;
  firstInventoryVIN;
  productDescription = '';
  isLoading = false;
  maxQuantity = 0;
  quantity = 1;
  stock = 0;

  caseModalIsOpen = false;

  _pageParams = null;
  _features = [];

  @wire(MessageContext)
  messageContext;

  @wire(CurrentPageReference)
  async getStateParameters(pageReference) {
    if (pageReference) {
      this._pageParams = pageReference.state;
      await this.initialize();
    }
  }

  async initialize() {
    this.isLoading = true;
    this.quantity = 1;

    try {
      const { productDetail, inventory, features } = await fetchProductDetail({
        productID: this.recordId,
        inventoryID: this.inventoryID
      });

      this.product = productDetail;
      this.productDescription = this.product.fields.Product_Description__c ?? 'N/A';
      this._features = features || [];

      if (inventory) {
        this.inventory = {
          ...inventory,
          ConversionPart: inventory.Conversion_Part__r?.Name
        };
        this.stock = inventory.Total_Not_On_Hold_Inventory__c;
        this.firstInventoryVIN = this.stock > 0
          ? inventory.PortalInventoryDetail__r?.[0].Serial_Number__c
          : null;

        this.maxQuantity = this.stock;
      } else {
        this.stock = productDetail.fields?.Total_Inventory__c || 0;
        this.maxQuantity = 500;
      }

    } catch (err) {
      auraExceptionHandler.logAuraException(err);
    } finally {
      this.isLoading = false;
    }
  }

  get features(){
    const byType = groupBy(this._features, 'WAVPortalDisplayFeatures_FeatureType')

    return Object.keys(byType)
      .map(type => ({
        type,
        descriptions: byType[type].map(item => item["WAVPortalDisplayFeatures_Feature_Description"])
      }))
  }

  get hasFeatures(){
    return this.features.length > 0
  }

  get inventoryID() {
    return this._pageParams?.inventoryId;
  }

  get isWav() {
    return !!this.inventoryID;
  }

  get isConvertedWav() {
    return this.isWav && this.inventory.VINType__c === VIN_TYPE_CONVERTED;
  }

  get isUnconvertedWav() {
    return this.isWav && this.inventory.VINType__c === VIN_TYPE_UNCONVERTED;
  }

  get productPriceLabel() {
    return this.isWav ? "Chassis Price" : "Your Price";
  }

  get stockInfo() {
    return this.stock === 0 ? "Out of Stock" : this.stock < 10 ? "Low Stock" : "In Stock";
  }

  get totalPrice() {
    return this.quantity * this.basePrice;
  }

  get price(){
    return this.isWav ? this.inventory.Chassis_Price__c : this.product.price;
  }

  get basePrice() {
    return this.isConvertedWav
      ? this.price + this.inventory.Conversion_Price__c
      : this.price;
  }

  get hasAvailableStock() {
    return this.stock > 0 || !this.product?.fields?.Conversion_Type__c;
  }

  get minimumQuantity() {
    return this.quantity <= 1;
  }

  get maximumQuantity() {
    return this.quantity >= this.maxQuantity;
  }

  get invalidQuantity() {
    return this.quantity < 1 || this.quantity > this.maxQuantity;
  }

  onQuantityChange(event) {
    this.quantity = Number(event.target.value);
  }

  incrementQuantity() {
    if (this.quantity < this.maxQuantity) {
      this.quantity++;
    }
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  checkValidQuantity() {
    if (this.quantity < 1) {
      this.quantity = 1;
    } else if (this.quantity > this.maxQuantity) {
      this.quantity = this.maxQuantity;
    }
  }

  async addToCart() {
    this.isConvertedWav
      ? (await this.wavAddToCart())
      : (await this.standardAddToCart());
  }

  async standardAddToCart(){
    const newLines = [{
      sfid: this.recordId,
      quantity: this.quantity
    }];

    this.isLoading = true;

    try {
      await addToCart({
        ctx: this.communityContext,
        newLines,
      });

      const toast = new ShowToastEvent({
        title: "Add To Cart",
        message: `Successfully added ${this.product.name} to cart`,
        variant: "success"
      });
      this.dispatchEvent(toast);

      publish(this.messageContext, cartChanged);

      // re-fetch to get update inventory info
      await this.initialize();
    } catch (err) {
      auraExceptionHandler.logAuraException(err);
    }
    finally {
      this.isLoading = false;
    }
  }

  async wavAddToCart(){
    this.isLoading = true;

    try {
      await addConvertedWavToCart({
        ctx: this.communityContext,
        inventoryID: this.inventoryID,
        quantity: this.quantity,
      });


      const toast = new ShowToastEvent({
        title: "Add To Cart",
        message: `Successfully added ${this.product.name} WAV to cart`,
        variant: "success"
      });
      this.dispatchEvent(toast);

      publish(this.messageContext, cartChanged);

      // re-fetch to get update inventory info
      await this.initialize();
    } catch (err) {
      auraExceptionHandler.logAuraException(err);
    }
    finally {
      this.isLoading = false;
    }
  }

  configure() {
    if(this.product?.fields?.Not_Configurable__c) {
      this.openCaseModal();
    } else {
      this.gotoWavConfigurator();
    }
  }

  openCaseModal(){
    this.caseModalIsOpen = true;
  }

  closeCaseModal() {
    this.caseModalIsOpen = false;
  }

  gotoWavConfigurator() {
    const productId = this.recordId;
    const inventoryId = this.inventoryID;
    const quantity = this.quantity;

    this[NavigationMixin.Navigate]({
      type: "comm__namedPage",
      attributes: {
        name: "wav_configuration__c",
      },
      state: {
        productId,
        inventoryId,
        quantity,
      },
    });
  }

  openHoldModal() {
    this.template.querySelector('c-request-hold-modal').show();
  }

}
