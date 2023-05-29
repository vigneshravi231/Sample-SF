
import {
  ADD_ADDRESS,
  INITIALIZE_STORE,
  LINE_LEVEL_SHIPPING_CHANGED,
  MAKE_CART_SELECTION,
  REMOVE_SPLIT,
  DEDUCT_SPLIT_QUANTITY,
  ADD_SPLIT_QUANTITY,
  SPLIT_ITEM,
  UPDATE_ITEM,
  UPDATE_SPLIT,
  SIMULATE_SPLIT,
  UPDATE_SPLIT_SELECTION,
} from "./checkoutActions";

import { uuidv4 } from "c/utils";

const initialState = {
  cart: {},
  cartItems: [],
  addresses: [],
  simulateSplit: [],
  contact: {},
  netTerms: null,
  orderDeliveryMethods: [],
  isCreditCardOnFileAvailable: false,
  partClassToOrderTypeMapping: {},
  partsOnly: false,
  buyerAccount: {},
  checkoutPermissions: {},
  paymentTypes: [],
  selection: {
    paymentOption: null,
    isLineLevelShipping: false,
    poNumber: null,
    billTo: {},
    shipTo: {},
    deliveryInstructions: null,
    deliveryBySplit: {},
    shippingAccountNumberBySplit: {},
    bySplit: {},
    termsAccepted: false,
  },
  errors: {
    poNumber: false,
    paymentOption: false,
    billTo: false,
    shipTo: false,
    termsAccepted: false,
  }
};

export default (state = initialState, action) => {
  switch (action.type) {
    case INITIALIZE_STORE: {
      return {
        ...state,
        ...action.payload
      };
    }
    case MAKE_CART_SELECTION: {
      const { field, value } = action.payload;
      return {
        ...state,
        selection: {
          ...state.selection,
          [field]: value
        }
      };
    }
    case ADD_ADDRESS: {
      const address = action.payload;
      return {
        ...state,
        addresses: [...state.addresses, address],
      };
    }
    case SPLIT_ITEM: {
      const splitFromID = action.payload;
      const cartItem = state.cartItems.find(i => i.Id === splitFromID);

      const splitItem = {
        UniqueId: uuidv4(),
        Quantity: 1,
        ListPrice: cartItem.ListPrice,
        SplitFromId: cartItem.Id,
        ShippingAddress: {},
        DisableDeduct: true
      }

      splitItem.DisableAdd = cartItem.Quantity <= 1;
      cartItem.splitItems = [...cartItem.splitItems, splitItem]

      return {
        ...state
      };
    }
    case REMOVE_SPLIT: {
      const {itemId, splitId} = action.payload;
      const cartItem = state.cartItems.find(i => i.Id === itemId);

      cartItem.splitItems = cartItem.splitItems.filter(
        (i) => i.UniqueId !== splitId
      );
      cartItem.disableSplit = false;

      return {
        ...state,
      }
    }
    case DEDUCT_SPLIT_QUANTITY: {
      const {itemId, splitId, splitDiff, cartItemDiff} = action.payload;
      const cartItem = state.cartItems.find(i => i.Id === itemId);
      const splitItem = cartItem.splitItems.find(s => s.UniqueId === splitId)

      Object.keys(splitDiff).forEach(key => {
        splitItem[key] = splitDiff[key];
      });

      Object.keys(cartItemDiff).forEach(key => {
        cartItem[key] = cartItemDiff[key];
      });

      return {
        ...state
      }
    }
    case ADD_SPLIT_QUANTITY: {
      const {itemId, splitId, splitDiff, cartItemDiff} = action.payload;
      const cartItem = state.cartItems.find(i => i.Id === itemId);
      const splitItem = cartItem.splitItems.find(s => s.UniqueId === splitId)

      Object.keys(splitDiff).forEach(key => {
        splitItem[key] = splitDiff[key];
      });

      Object.keys(cartItemDiff).forEach(key => {
        cartItem[key] = cartItemDiff[key];
      });

      return {
        ...state
      }
    }
    case UPDATE_SPLIT: {
      const {itemId, splitId, diff} = action.payload;
      const cartItem = state.cartItems.find(i => i.Id === itemId);
      const splitItem = cartItem.splitItems.find(s => s.UniqueId === splitId)

      Object.keys(diff).forEach(key => {
        splitItem[key] = diff[key];
      });

      return {
        ...state
      }
    }
    case UPDATE_ITEM: {
      const {itemId, diff} = action.payload;
      const cartItem = state.cartItems.find(i => i.Id === itemId);

      Object.keys(diff).forEach(key => {
        cartItem[key] = diff[key]
      });

      return {
        ...state
      }
    }
    case UPDATE_SPLIT_SELECTION: {
      const {splitKey, extend} = action.payload;
      return {
        ...state,
        selection: {
          ...state.selection,
          bySplit: {
            ...state.selection.bySplit,
            [splitKey]: {
              ...state.selection.bySplit[splitKey],
              ...extend,
            }
          }
        }
      }
    }
    case LINE_LEVEL_SHIPPING_CHANGED: {
      const current = state.selection.isLineLevelShipping;

      const cartItems = state.cartItems.map(item => {
        return {
          ...item,
          ShippingAddress: {},
          splitItems: [],
        }
      })

      return {
        ...state,
        cartItems,
        selection: {
          ...state.selection,
          isLineLevelShipping: !current,
          deliveryBySplit: {},
        }
      }
    }
    case SIMULATE_SPLIT: {
      return {
        ...state,
        simulateSplit: action.payload,
      }
    }
    default:
    case "somedefualt_b":
      return state;
  }
}
