

import { LightningElement, api } from "lwc";

export const communityContext = {
	effectiveAccountId: null,
};

class Provider extends LightningElement {
	get communityContext(){
		return communityContext;
	}
}

export const ContextProvider = () => Provider

export default class CommunityContextProvider extends LightningElement {
	connectedCallback() {
		this.safelyCall(super.connectedCallback);
	}

	disconnectedCallback() {
		this.safelyCall(super.disconnectedCallback);
	}

	safelyCall(fn){
		if(typeof fn === "function"){
			fn.call(this);
		}
	}

	@api get effectiveAccountId() {
		return this._effectiveAccountId;
	}
	set effectiveAccountId(value) {
		this._effectiveAccountId = value;
		communityContext.effectiveAccountId = value;
	}

	_effectiveAccountId;
}
