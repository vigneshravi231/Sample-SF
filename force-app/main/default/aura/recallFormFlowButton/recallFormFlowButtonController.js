({

  initFlow : function(component, event, helper) {
    component.set("v.isOpen", true);
    console.log('FIRED');
    let flow = component.find("flowData");
    let inputVariables = [
      {
        name: "recordId",
        type: "String",
        value: component.get("v.recordId")
      }
    ];
    flow.startFlow("Recall_Claim_Form", inputVariables);
  },

  closeFlowModal : function(component, event, helper) {
    sessionStorage.clear();
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
      sessionStorage.clear();
    }
  },

  createLift: function (component, event, helper) {
    var prepopulated = {
      AssetId: component.get('v.recordId'),
      Lift_Serial__c: event.getParam('VIN_Serial_Number__c'),
      Lift_Model__c: event.getParam('ProductCode'),
      Dealer_Name__c: event.getParam('AccountId')
    };
    component.set('v.prepopulatedValues', prepopulated);
    component.set('v.caseIsLift', true);
    component.set('v.caseModalOpen', true);
  },

  createVehicle: function (component, event, helper) {
    var prepopulated = {
      AssetId: component.get('v.recordId'),
      Vehicle_VIN__c: event.getParam('VIN_Serial_Number__c'),
      Dealer_Name__c: event.getParam('AccountId')
    };
    component.set('v.prepopulatedValues', prepopulated);
    component.set('v.caseIsLift', false);
    component.set('v.caseModalOpen', true);
  },

  closeCaseModal: function (component, event, helper) {
    component.set('v.caseModalOpen', false);
  },

  submitLift: function (component, event, helper) {
    component.set('v.caseLoading', true);
    event.preventDefault();
    var fields = event.getParam('fields');
    component.find('liftCase').submit(fields);
  },

  submitVehicle: function (component, event, helper) {
    component.set('v.caseLoading', true);
    event.preventDefault();
    var fields = event.getParam('fields')
    component.find('vehicleCase').submit(fields);
  },

  onLoad: function (component, event, helper) {
    component.set('v.caseLoading', false);
  },

  onSuccess: function (component, event, helper) {
    var toastEvent = $A.get("e.force:showToast");
    toastEvent.setParams({
      "title": "Success!",
      "message": "Your case has been successfully submitted!",
      "type": "success"
    });
    toastEvent.fire();
    component.set('v.caseLoading', false);
    component.set('v.caseModalOpen', false);
  },

  onError: function (component, event, helper) {
    var toastEvent = $A.get("e.force:showToast");
    toastEvent.setParams({
      "title": "An error has occurred.",
      "message": "Please notify your Salesforce admin.",
      "type": "error"
    });
    toastEvent.fire();
    component.set('v.caseLoading', false);
  }
});