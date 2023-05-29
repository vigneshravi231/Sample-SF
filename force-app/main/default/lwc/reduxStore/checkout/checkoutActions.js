import { deepClone } from "c/utils";

export const INITIALIZE_STORE = "CHECKOUT/INITIALIZE";
export const MAKE_CART_SELECTION = "CHECKOUT/MAKE_CART_SELECTION";
export const ADD_ADDRESS = "CHECKOUT/ADD_ADDRESS";
export const SPLIT_ITEM = "CHECKOUT/SPLIT_ITEM";
export const REMOVE_SPLIT = "CHECKOUT/REMOVE_SPLIT";
export const DEDUCT_SPLIT_QUANTITY = "CHECKOUT/DEDUCT_SPLIT_QUANTITY";
export const ADD_SPLIT_QUANTITY = "CHECKOUT/ADD_SPLIT_QUANTITY";
export const UPDATE_SPLIT = "CHECKOUT/UPDATE_SPLIT";
export const UPDATE_ITEM = "CHECKOUT/UPDATE_CART_ITEM";
export const LINE_LEVEL_SHIPPING_CHANGED = "CHECKOUT/LINE_LEVEL_SHIPPING_CHANGED";
export const SIMULATE_SPLIT = "CHECKOUT/SIMULATE_SPLIT";
export const UPDATE_SPLIT_SELECTION = "CHECKOUT/UPDATE_SPLIT_SELECTION";

export const initializeStore = (newStore) => dispatch => {
  dispatch({
    type: INITIALIZE_STORE,
    payload: newStore
  });
};

export const makeCartSelection = (selection) => dispatch => {
  dispatch({
    type: MAKE_CART_SELECTION,
    payload: selection
  });
};

export const simulateSplit = (split) => dispatch => {
  dispatch({
    type: SIMULATE_SPLIT,
    payload: split,
  });
};

export const addAddress = (address) => dispatch => {
  dispatch({
    type: ADD_ADDRESS,
    payload: address,
  });
};

export const splitItem = (payload) => dispatch => {
  dispatch({
    type: SPLIT_ITEM,
    payload,
  });
};

export const removeSplit = (payload) => dispatch => {
  dispatch({
    type: REMOVE_SPLIT,
    payload
  });
};

export const deductSplitQuantity = (payload) => dispatch => {
  dispatch({
    type: DEDUCT_SPLIT_QUANTITY,
    payload
  });
}

export const addSplitQuantity = (payload) => dispatch => {
  dispatch({
    type: ADD_SPLIT_QUANTITY,
    payload
  });
}

export const updateSplit = (payload) => dispatch => {
  dispatch({
    type: UPDATE_SPLIT,
    payload,
  });
};

export const updateItem = (payload) => (dispatch, getState) => {
  const {itemId, diff} = payload;
  const cartItem = deepClone(getState().checkout.cartItems.find(i => i.Id === itemId));

  dispatch({
    type: UPDATE_ITEM,
    payload,
  });

  const didAddressChange = !!diff.ShippingAddress?.Id && diff.ShippingAddress.Id !== cartItem.ShippingAddress.Id;
  const splitWithSameAddress = cartItem.splitItems.find(s => s.ShippingAddress.Id === diff.ShippingAddress?.Id)


  if(didAddressChange && !!splitWithSameAddress){
    const splitDiff = {
      ShippingAddress: {}
    };
    dispatch({
      type: UPDATE_SPLIT,
      payload: {itemId, splitId: splitWithSameAddress.UniqueId, diff: splitDiff}
    })
  }
};

export const updateSplitSelection = (payload) => dispatch => {
  dispatch({
    type: UPDATE_SPLIT_SELECTION,
    payload,
  });
};
