

import { ShowToastEvent } from "lightning/platformShowToastEvent";

class AuraExceptionHandler {

    constructor(){
        this.log = new AuraExceptionLogger();
    }

    logAuraException(error){
        this.log.startMarker();
        this.log.commonException(error);
        this.log.customException(error);
        this.log.endMarker();

    }

    handleAddToCartException(error, context) {
        this.logAuraException(error);
        const message = this.isCartLocked(error) ?
          "Please finish or abort checkout before trying to add to cart" :
          "There was an issue adding item to cart, please try again later";

        const toast = new ShowToastEvent({
            title: "Add To Cart",
            variant: "error",
            message
        });
        context.dispatchEvent(toast);
    }

    isCartLocked(error){
        try {
            return JSON.parse(error.body.message).serverMessage.includes('is locked')
        } catch(e){
            console.log('eee', e)
            return false;
        }
    }
}

class AuraExceptionLogger {

    constructor(){
        this.util = new util();
    }

    startMarker() {
        console.log('%c :: ENTER AURA ERROR LOG :: ', 'color:#0592cb');
    }

    endMarker() {
        console.log('%c :: EXIT AURA ERROR LOG :: ', 'color:#0592cb');
    }

    commonException(error){
        console.log('ERROR: ');
        console.log(error);
    }

    customException(error) {
        if(error.body){
            console.log('AURA HANDLED EXCEPTION MESSAGE: ');
            this.util.handleCustomException(error);
        }
    }

}

class util {

    handleCustomException(error){
        let err;
        let isJSON = this.isJSON(error.body.message);
        err = isJSON ? JSON.parse(error.body.message) : error.body.message;
        console.log(err);
    }

    isJSON(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

}

const auraExceptionHandler = new AuraExceptionHandler();

export { auraExceptionHandler };
