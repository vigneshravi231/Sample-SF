


({

  doInit: function(component, event, helper) {

  },

  initFlow : function(component, event, helper) {
    component.set("v.isOpen", true);
    console.log('FIRED');
    let flow = component.find("flowData");
    flow.startFlow("MAP_Case_Form");
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
  },

});