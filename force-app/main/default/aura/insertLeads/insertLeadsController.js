({
    /**
     * On initialization of this component, set the prechatFields attribute and render pre-chat fields.
     * 
     * @param cmp - The component for this state.
     * @param evt - The Aura event.
     * @param hlp - The helper for this state.
     */
	onInit: function(cmp, evt, hlp) {

        // Get pre-chat fields defined in setup using the prechatAPI component
		var prechatFields = cmp.find("prechatAPI").getPrechatFields();
        // Get pre-chat field types and attributes to be rendered
        var prechatFieldComponentsArray = hlp.getPrechatFieldAttributesArray(prechatFields,cmp);
        // Make asynchronous Aura call to create pre-chat field components
        $A.createComponents(
            prechatFieldComponentsArray,
            function(components, status, errorMessage) {
                if(status === "SUCCESS") {
                    cmp.set("v.prechatFieldComponents", components);
                }
            }
        );
    },
    
    /**
     * Event which fires when start button is clicked in pre-chat
     * 
     * @param cmp - The component for this state.
     * @param evt - The Aura event.
     * @param hlp - The helper for this state.
     */
    handleStartButtonClick: function(cmp, evt, hlp) {
        //component.set("v.showFields","false");
    
        hlp.onStartButtonClick(cmp);
        //cmp.set("v.disabled", true);
    },
    handleChange: function(cmp, evt, hlp) {
    },
    handleNext : function(cmp, evt, hlp){
        let isAgree = cmp.get("v.isAgree");
        // If the pre-chat fields pass validation, start a chat
        if(isAgree==false){
           cmp.set("v.checkBoxError","true"); 
        }
        else{
          cmp.set("v.checkBoxError","false"); 
          
          let button = evt.getSource();
          button.set('v.disabled',true);
          
        }
        hlp.onStartButtonClick(cmp);
    },
    checkBox : function(cmp, evt, hlp){
        let isAgree = cmp.get("v.isAgree");
        // If the pre-chat fields pass validation, start a chat
        if(isAgree){
           cmp.set("v.checkBoxError","false"); 
        }
    }
});