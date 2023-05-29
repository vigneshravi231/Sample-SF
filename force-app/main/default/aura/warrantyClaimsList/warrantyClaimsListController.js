


({

  initFlow : function(component, event, helper) {
    component.set("v.isOpen", true);
    console.log('FIRED');
    let flow = component.find("flowData");
    let inputVariables = [
      {
        name: "CaseId",
        type: "String",
        value: event.getParam("CaseId")
      }
    ];
    flow.startFlow("Recall_Claim_Form", inputVariables);
  },

  closeFlowModal : function(component, event, helper) {
    component.set("v.isOpen", false);
  },

  closeModalOnFinish : function(component, event, helper) {
    if(event.getParam('status') === "FINISHED") {
      component.set("v.isOpen", false);
      let toastEvent = $A.get("e.force:showToast");
      toastEvent.setParams({
        "title": "Request successfully submitted!",
        "message": "You will be notified of any updates to your case.",
        "type": "success"
      });
      toastEvent.fire();
    }
  }
});