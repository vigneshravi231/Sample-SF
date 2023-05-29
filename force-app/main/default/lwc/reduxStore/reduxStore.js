

import checkoutStore from "./checkout/checkoutStore";
import * as checkoutActions from "./checkout/checkoutActions"

import warrantyStore from "./warranty/store";
import * as warrantyActions from "./warranty/actions"
import {getTemplate} from "./warranty/template-warranty";


export default {
  warranty: warrantyStore,
  checkout: checkoutStore,
}

export const warranty = {
  actions: warrantyActions,
  template: getTemplate,
}

export const checkout = {
  actions: checkoutActions,
}
