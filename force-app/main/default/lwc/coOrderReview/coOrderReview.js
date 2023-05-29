

import { api, LightningElement, track } from "lwc";
import { Redux } from "c/lwcRedux";
import { checkout } from "c/reduxStore";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { groupBy2Keys, makeUnique, uuidv4 } from "c/utils";

export default class CoOrderReview extends Redux(LightningElement) {
  @api miscCharges = false;
  @track isLoading = false;
  hasSplit;

  mapStateToProps(state) {
    return {
      cart: state.checkout.cart,
      cartItems: state.checkout.cartItems,
      addresses: state.checkout.addresses,
      isLineLevelShipping: state.checkout.selection.isLineLevelShipping,
      partClassToOrderTypeMapping: state.checkout.partClassToOrderTypeMapping
    };
  }

  mapDispatchToProps() {
    return {
      makeSelection: checkout.actions.makeCartSelection,
      addAddress: checkout.actions.addAddress,
      splitItem: checkout.actions.splitItem,
      removeSplit: checkout.actions.removeSplit,
      deductSplitQuantity: checkout.actions.deductSplitQuantity,
      addSplitQuantity: checkout.actions.addSplitQuantity,
      updateSplit: checkout.actions.updateSplit,
      updateItem: checkout.actions.updateItem
    };
  }

  get itemGroups() {
    const byConfigurationID = groupBy2Keys(
      this.props.cartItems || [],
      "Configuration_ID__c",
      "VIN_Number__c"
    );

    const isConversion = item => item.Product2.acCore__PartClass__c === "FGCV";
    const isChassis = item => item.Product2.acCore__PartClass__c === "CHAS";

    const isTurny = items => items.every(item => item.Product2.acCore__PartClass__c === "FGGS");
    const isVehicle = items => items.some(isConversion);

    const groups = Object.keys(byConfigurationID).reduce((all, key) => {
      const items = byConfigurationID[key];
      const configurationID = key.split('__').shift();
      const hasConfigurationID = !!configurationID && configurationID !== 'undefined';

      if (!hasConfigurationID) {
        return [
          ...all,
          ...items.map(item => ({
            ...item,
            uniqueId: item.Id,
            name: item.Product2.Name,
            description: item.Product2.Description,
            sku: item.Product2.ProductCode,
            smartString: item.Configuration_Smart_String__c,
            isConfiguration: false,
          })),
        ];
      } else if (isTurny(items)) {
        return [
          ...all,
          ...items.map(item => ({
            ...item,
            name: item.Product2.Name,
            description: item.Product2.Description,
            smartString: item.Configuration_Smart_String__c,
            sku: item.Product2.ProductCode,
            isConfiguration: true,
            isTurny: true,
          })),
        ];
      } else if (isVehicle(items)) {
        const chassis = items.find(isChassis);
        const conversion = items.find(isConversion);
        return [
          ...all,
          {
            Id: chassis.Id,
            imageUrl: chassis.imageUrl,
            name: chassis.Product2.Name,
            description: chassis.Product2.Description,
            smartString: chassis.Configuration_Smart_String__c,
            sku: chassis.Product2.ProductCode,
            isConfiguration: true,
            isWav: true,
            TotalPrice: chassis.SalesPrice + conversion.SalesPrice,
            Quantity: chassis.Quantity,
            chassis,
            conversion,
          },
        ];
      }

      return [...all];
    }, []);

    console.log(JSON.parse(JSON.stringify(groups)));

    return groups;
  }

  get cartItems() {
    return this.itemGroups.map((item) => {
      const splitQuantities = (item.splitItems || []).reduce(
        (total, split) => total + split.Quantity,
        0
      );


      const inUseAddresses = item.isWav
        ? [item.chassis.ShippingAddress.Id].filter(Boolean)
        : makeUnique([
          item.ShippingAddress.Id,
          ...item.splitItems.reduce((acc, i) => [...acc, i.ShippingAddress.Id], [])
        ]).filter(Boolean);


      item.shippingOptions = this.makeShippingOptions(this.shippingAddresses, item.isWav ? item.chassis : item);
      item.Quantity = item.isWav ? item.Quantity : Math.max(item.baseQuantity - splitQuantities, 1);
      item.TotalLineAmount = item.isWav ? item.TotalPrice : item.Quantity * item.SalesPrice;
      item.canBeSplit = !item.isWav && this.props.isLineLevelShipping && item.Quantity > 1;
      item.splitItem = false;

      item.splitItems = (item.splitItems || []).map((split) => {
        split.TotalLineAmount = split.Quantity * split.SalesPrice;
        split.Parts_Class__c = item.Parts_Class__c;
        split.splitItem = true;

        const availableAddresses = this.shippingAddresses
          .filter(a => split.ShippingAddress.Id === a.Id || !inUseAddresses.includes(a.Id));

        split.shippingOptions = this.makeShippingOptions(availableAddresses, split);
        return split;
      });


      const splitCount = item.splitItems.length;
      const shippingAddressesCount = this.shippingAddresses.length;
      item.disableSplit = item.Quantity === 1 || splitCount >= shippingAddressesCount - 1;
      item.disableAdd = item.Quantity === 1;

      return item;
    });
  }

  get splitPossible() {
    return (
      (this.props.isLineLevelShipping && this.totalQuantity > this.totalItems) || (this.props.isLineLevelShipping && this.hasSplit)
    );
  }

  get totalQuantity() {
    return this.props.cartItems.reduce((acc, i) => acc + i.Quantity, 0);
  }

  get totalItems() {
    return this.props.cartItems.length;
  }

  get shippingAddresses() {
    return this.props.addresses.filter((a) => a.AddressType === "Shipping");
  }

  get hasShippingOptions() {
    return this.shippingAddresses.length > 0;
  }

  makeShippingOptions(addresses, item) {
    const makeLabel = (a) =>
      `${a.street} ${a.city}, ${a.state} ${a.postalCode} ${a.country}`;

    let partsItem = this.props.partClassToOrderTypeMapping[item.Parts_Class__c] !== null
      && this.props.partClassToOrderTypeMapping[item.Parts_Class__c] === 'Parts';

    return addresses.reduce(function(acc, a) {
      if(partsItem) {
        acc.push({label: makeLabel(a.Address), value: a.Id});
      } else {
        if((!a.One_Time_Shipping__c)) {
          acc.push({label: makeLabel(a.Address), value: a.Id});
        }
      }
      return acc;
    }, []);
  }

  handleShippingSelection(event) {
    const addressId = event.target.value;
    const { itemId, splitId } = event.target.dataset;

    const address = this.findAddress(addressId);

    const diff = {
      ShippingAddress: address
    };

    if (!!splitId) {
      this.props.updateSplit({ itemId, splitId, diff });
    } else {
      this.props.updateItem({ itemId, diff });
    }
  }

  handleWavShippingSelection(event) {
    const addressId = event.target.value;
    const address = this.findAddress(addressId);

    const diff = {
      ShippingAddress: address
    };

    const { itemId } = event.target.dataset;
    const wav = this.cartItems.find(item => item.Id === itemId);

    this.props.updateItem({ itemId: wav.chassis.Id, diff });
    this.props.updateItem({ itemId: wav.conversion.Id, diff });
  }

  deductSplitItem(event) {
    const { itemId, splitId } = event.target.dataset;

    const cartItem = this.cartItems.find((i) => i.Id === itemId);
    const splitItem = cartItem.splitItems.find(s => s.UniqueId === splitId);

    const newSplitQty = splitItem.Quantity -1

    const splitDiff = {
      Quantity: newSplitQty,
      DisableDeduct: newSplitQty === 1,
    };

    const cartItemDiff = {
      Quantity: cartItem.Quantity - 1
    }

    this.props.deductSplitQuantity({ itemId, splitId, splitDiff, cartItemDiff });

  }

  addSplitItem(event) {
    const { itemId, splitId } = event.target.dataset;
    const cartItem = this.cartItems.find((i) => i.Id === itemId);
    const splitItem = cartItem.splitItems.find(s => s.UniqueId === splitId);

    const newSplitQty = splitItem.Quantity + 1;

    const splitDiff = {
      Quantity: newSplitQty,
      DisableDeduct: newSplitQty === 1,
    };

    const cartItemDiff = {
      Quantity: cartItem.Quantity + 1
    }

    this.props.deductSplitQuantity({ itemId, splitId, splitDiff, cartItemDiff });
  }

  handleItemSplit(event) {
    this.hasSplit = true;
    const { itemId } = event.target.dataset;
    this.props.splitItem(itemId);
  }

  removeSplitItem(event) {
    const { itemId, splitId } = event.target.dataset;
    this.props.removeSplit({ itemId, splitId });
  }

  handleSplitItemQuantityChange(event) {
    const { itemId, splitId } = event.target.dataset;
    const qty = this.tryParseInt(event.target.value, 1);

    const cartItem = this.cartItems.find((i) => i.Id === itemId);
    const splitItem = cartItem.splitItems.find(s => s.UniqueId === splitId);

    const oldQty = splitItem.Quantity;
    const isNewQtyValid = cartItem.Quantity - (qty - oldQty) >= 1 && qty >= 1;

    const newQty = isNewQtyValid ? qty : oldQty;

    const diff = {
      Quantity: newQty,
      DisableDeduct: newQty === 1,
    };

    event.target.value = newQty;

    this.props.updateSplit({ itemId, splitId, diff });
  }

  findAddress(sfid) {
    return this.props.addresses.find((a) => a.Id === sfid);
  }

  tryParseInt(maybeInt, fallback) {
    try {
      return parseInt(maybeInt);
    } catch (e) {
      return fallback;
    }
  }
}
