

import { api, LightningElement } from "lwc";
import { warranty as warrantyModule } from "c/reduxStore";
import { Redux } from "c/lwcRedux";

export default class WarrantyRegistrationCsvError extends Redux(LightningElement) {

    @api showCSVErrorEditModal;

    constructor() {
        super();
    }

    mapStateToProps(state) {
        return {
            invalidWarranties: state.warranty.invalidWarranties
        };
    }

    mapDispatchToProps() {
        return {
            removeWarranty: warrantyModule.actions.removeInvalidWarranty
        };
    }

    get hasInvalidWarranties() {
        return this.props.invalidWarranties?.length > 0;
    }

    reload() {
        window.location.reload();
    }

    handleRemove(event) {
        const uuid = event.currentTarget.value;
        this.props.removeWarranty(uuid);
    }
}
