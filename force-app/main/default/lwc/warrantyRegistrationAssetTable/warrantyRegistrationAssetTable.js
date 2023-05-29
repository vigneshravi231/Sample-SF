

import { LightningElement, api, track, wire } from "lwc";
import {Redux} from "c/lwcRedux";
import {warranty as warrantyModule} from "c/reduxStore";
import { CurrentPageReference } from 'lightning/navigation';

import CSV_TEMPLATE from "@salesforce/resourceUrl/SampleAbilityWarrantyRegistrationTemplate";
import CSV_TEMPLATE_LIFT from "@salesforce/resourceUrl/SampleAbilityWarrantyRegistrationTemplateLift";

export default class WarrantyRegistrationAssetTable extends Redux(LightningElement) {

    @api showAssetEditModal;
    @api showAssetModal;
    @track showCSVModal = false;

    csvTemplateUrl = CSV_TEMPLATE;
    csvTemplateLiftUrl = CSV_TEMPLATE_LIFT;

    loaded = false;
    assetId = null;

    @wire(CurrentPageReference)
    handlePageParams(pageRef){
        this.assetId = pageRef.state.asset
    }

    mapStateToProps(state){
        return {
            warranties: state.warranty.warranties,
            warrantiesById: state.warranty.warrantiesById,
        }
    }

    mapDispatchToProps(){
        return {
            removeWarranty: warrantyModule.actions.removeWarranty,
        }
    }

    renderedCallback() {
        if(!this.loaded && !!this.assetId){

            this.template
            .querySelector("c-warranty-registration-edit-asset")
            .fromAsset(this.assetId)

            this.loaded = true;
        }

    }

    constructor() {
        super();
    }

    addWarranty() {
        const recordTemplate = warrantyModule.template()

        const newWarranty = {
            uuid: null,
            vin: null,
            record: recordTemplate,
        }

        this.openEditModal(newWarranty);
    }

    editWarranty(event) {
        const id = event.currentTarget.value;
        const warranty = this.props.warrantiesById[id];

        this.openEditModal(warranty);
    }

    removeWarranty(event) {
        const id  = event.currentTarget.value;
        this.props.removeWarranty(id);
    }

    openEditModal(warranty){
        this.template
        .querySelector("c-warranty-registration-edit-asset")
        .edit(warranty)
    }

    openAssetModal() {
        this.showAssetModal = true;
    }

    handleAssetModalToggle(event) {
        this.showAssetModal = event.detail.showModal;
    }

    openCSVModal() {
        this.template.querySelector('c-warranty-registration-c-s-v').show();
    }

    get hasWarranties() {
        return this.props.warranties?.length > 0;
    }
}
