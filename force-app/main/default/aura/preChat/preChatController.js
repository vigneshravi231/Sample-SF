({
	/**
	 * After this component has rendered, create an email input field
	 */
	onRender: function(component, event, helper) {
    
		// Get array of pre-chat fields defined in Setup using the prechatAPI component
		//var prechatFields = component.find("prechatAPI").getPrechatFields();
		// This example renders only the email field using the field info that comes back from prechatAPI getPrechatFields()
		/*var emailField = prechatFields.find(function(field) {
			return field.type === "inputEmail";
		});*/
		
		
		// Append an input element to the prechatForm div.
		//helper.renderEmailField(emailField);
	},
	onStartButtonClick: function(component, event, helper) {

		var prechatInfo = helper.createStartChatDataArray();
		
		/* if(component.find("prechatAPI").validateFields(prechatInfo).valid) {
			component.find("prechatAPI").startChat(prechatInfo);
		} else {
			// Show some error
		} */
	},
	SampleAbility: function(component,event,helper){
     
		//window.open("https://Sample.secure.force.com/apex/CustomerPreChat_Lead_New");
		component.set("v.showLeadForm","true");
		component.set("v.showCaseForm","false");
		let ownerImage = component.find("ownerImage");
		$A.util.addClass(ownerImage, 'hideImage');
		let welcome = component.find("welcome");
		$A.util.addClass(welcome, 'hideImage');

	},
	ownerAvailabilty : function(component,event,helper){
		//window.open("https://Sample.secure.force.com/apex/CustomerPreChat_New");
		component.set("v.showLeadForm","false");
		component.set("v.showCaseForm","true");
		let SampleImage = component.find("SampleImage");
		$A.util.addClass(SampleImage, 'hideImage');
		let welcome = component.find("welcome");
		$A.util.addClass(welcome, 'hideImage');
	}
});