

import { LightningElement, wire, api, track } from "lwc";

import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from "lightning/messageService";
import cartChanged from "@salesforce/messageChannel/lightning__commerce_cartChanged";

import _fetchAssetParts from "@salesforce/apex/Asset360CatalogController.fetchPartsFor";
import _addToCart from "@salesforce/apex/CartController.addToCart";

const $fetchAssetParts = sureThing(_fetchAssetParts);
const $addToCart = sureThing(_addToCart);

import { auraExceptionHandler } from "c/auraExceptionHandler";
import { sureThing, lower } from "c/utils";

import { ContextProvider } from "c/communityContextProvider";

export default class Asset360Catalog extends ContextProvider(LightningElement) {

  showSpinner;

  _pagination = {
    firstPage: 1,
    pageSize: 25,
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0
  };

  @api isOutsideCommunity;

  @api
  get pagination() {
    const recordCount = this.filteredParts.length;

    const totalRecords = recordCount;
    const totalPages = Math.ceil(recordCount / this._pagination.pageSize);

    this._pagination.currentPage =
      this._pagination.currentPage > totalPages
        ? 1
        : this._pagination.currentPage;

    return {
      ...this._pagination,
      totalRecords,
      totalPages
    };
  }

  @wire(MessageContext)
  messageContext;

  @api recordId;

  @track searchQuery = "";
  @track parts = [];
  @track categories = [];

  @track filterCategories = [];

  get filterCategoriesSelected() {
    return this.filterCategories.length > 0;
  }

  get displayAddToCart() {
    return !this.isOutsideCommunity;
  }

  async connectedCallback() {

    this.showSpinner = true;

    const { ok, data, error } = await $fetchAssetParts({
      ctx: this.communityContext,
      assetId: this.recordId,
    });

    if (ok) {
      this.parts = data.map(part => ({
        ...part,
        quantity: 0,
        cannotAdd: true,
        hasPrice: part.price > 0,
      }));
      console.log(JSON.parse(JSON.stringify(this.parts)))
      this.categories = this.extractCategories(this.parts);
      this.showSpinner = false;
    } else {
      auraExceptionHandler.logAuraException(error);
      this.showSpinner = false;
    }
  }

  extractCategories(parts) {
    const categoriesMap = parts.reduce((acc, part) => {
      (part.categories || []).forEach(category => {
        acc[category.Id] = category.Name;
      });
      return acc;
    }, {});

    return Object.keys(categoriesMap).map(sfid => ({
      sfid,
      name: categoriesMap[sfid]
    }));
  }

  get filteredParts() {
    const matchesQuery = part =>
      lower(part.name).includes(lower(this.searchQuery)) ||
      lower(part.description).includes(lower(this.searchQuery));

    const filterCategories = this.filterCategories.map(c => c.sfid);
    const noCategoryFilters = !filterCategories.length;

    const matchesCategory = part => {
      const partCategories = (part.categories || []).map(c => c.Id);
      return noCategoryFilters || partCategories.some(
        sfid => filterCategories.includes(sfid)
      );
    };

    return this.parts.filter(part => {
      return matchesQuery(part) && matchesCategory(part);
    });
  }

  get paginatedParts() {
    const currentPageIndex = Math.max(this.pagination.currentPage - 1, 0);
    const start = currentPageIndex * this.pagination.pageSize;
    const end = (currentPageIndex + 1) * this.pagination.pageSize;

    console.log(JSON.parse(JSON.stringify(this.filteredParts)))

    return (this.filteredParts || []).slice(start, end);
  }

  handlePaginationChange(event) {
    const paginationDiff = event.detail;

    this._pagination = {
      ...this._pagination,
      ...paginationDiff
    };

    this.scrollTop();
  }

  scrollTop(){
    const topDiv = this.template.querySelector(".topmost-div");
    topDiv.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }

  handleSearchQueryChange(event) {
    this.searchQuery = event.target.value;
  }

  handleProductQuantityChange(event) {
    const sfid = event.target.dataset.id;
    const qty = parseInt(event.target.value);

    const part = this.parts.find(p => p.sfid === sfid);
    part.quantity = Math.max(qty, 0);

    const canAdd = part.quantity > 0 && part.hasPrice;
    part.cannotAdd = !canAdd;
  }

  addCategoryFilter(event) {
    event.stopPropagation();
    event.preventDefault();

    const categoryId = event.currentTarget.dataset.id;
    const category = this.categories.find(c => c.sfid === categoryId);

    this.filterCategories = [
      ...new Set([...this.filterCategories, category])
    ];
  }

  removeCategoryFilter(event) {
    event.stopPropagation();
    event.preventDefault();

    const sfid = event.currentTarget.dataset.id;
    this.filterCategories = this.filterCategories.filter(
      c => c.sfid !== sfid
    );
  }

  clearAllCategoryFilters(event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.filterCategories.length > 0) {
      this.filterCategories = [];
    }
  }

  async addToCart(event) {
    const partId = event.currentTarget.dataset.id;
    const part = this.parts.find(p => p.sfid === partId);

    const newLines = [
      {
        quantity: part.quantity,
        sfid: part.sfid
      }
    ];

    const { ok, error } = await $addToCart({
      ctx: this.communityContext,
      newLines,
    });

    if (ok) {
      part.quantity = 0;
      part.cannotAdd = true;

      const toast = new ShowToastEvent({
        title: "Add To Cart",
        message: `Successfully added ${part.name} to cart`,
        variant: "success"
      });
      this.dispatchEvent(toast);

      publish(this.messageContext, cartChanged);
    } else {
      auraExceptionHandler.logAuraException(error);
    }
  }
}
