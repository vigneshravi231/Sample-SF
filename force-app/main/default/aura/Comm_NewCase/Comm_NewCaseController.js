/**
 * Created by Slav on 06.03.2020.
 */

({
            createLift: function (component, event, helper) {
                var createRecordEvent = $A.get("e.force:createRecord");
                createRecordEvent.setParams({
                    "entityApiName" : "Case",
                    "recordTypeId" : "0120a000000LR4YAAW"
                });
                createRecordEvent.fire();
            },

            createVehicle: function (component, event, helper) {
                var createRecordEvent = $A.get("e.force:createRecord");
                createRecordEvent.setParams({
                    "entityApiName" : "Case",
                    "recordTypeId" : "0120a000000LR4ZAAW"
                });
                createRecordEvent.fire();
            },

            createClickDrive: function (component, event, helper) {
                var createRecordEvent = $A.get("e.force:createRecord");
                createRecordEvent.setParams({
                    "entityApiName" : "Case",
                    "recordTypeId" : "0125b000000qhuyAAA"
                });
                createRecordEvent.fire();
            }
});