({
	 getData : function(cmp) {
        var action = cmp.get('c.getSurveyFeedbackList');
        action.setCallback(this, $A.getCallback(function (response) {
            var state = response.getState();
            console.log('state survey result'+state);
            if (state === "SUCCESS") {
                console.log(response.getReturnValue());
                cmp.set('v.mydata', response.getReturnValue());               
            } else if (state === "ERROR") {
                var errors = response.getError();
                console.error(errors);
            }
        }));
          $A.enqueueAction(action);
    }
})