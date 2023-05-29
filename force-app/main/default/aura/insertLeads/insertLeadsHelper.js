({
  /*
   *
   * Map of pre-chat field label to pre-chat field name (can be found in Setup)
   */
  fieldLabelToName: {
    "First Name": "FirstName",
    "Last Name": "LastName",
    "Country Chat": "Country_Chat__c",
    "Email Address": "Email Address",
    
    "chatRecordId":"chatRecordId__c",
    
    "Manufacturer": "Manufacturer__c"
  
  },

  /**
   * Event which fires the function to start a chat request (by accessing the chat API component)
   *
   * @param cmp - The component for this state.
   */
  onStartButtonClick: function(cmp) {

    var prechatFieldComponents = cmp.find("prechatField");
    var fields;

    // Make an array of field objects for the library
    fields = this.createFieldsArray(prechatFieldComponents);
    let leadList = [];
    let fieldError = false;
    // Check whether to insert lead or account records.
    let isLead = cmp.get("v.isLead");
    
   

    cmp.set("v.firstNameError", "false");
    cmp.set("v.lastNameError", "false");
    cmp.set("v.emailError", "false");
    cmp.set("v.countryError", "false");

    for (var key in fields) {
      let obj = {};

console.log(fields[key].name )
      if (fields[key].name == "Email") {
        let e = fields[key].value;
        if (!(e.indexOf("@") > -1) || e.charAt(e.length - 1) == "@") {
          cmp.set("v.emailError", "true");
          fieldError = true;
        }
      }

//default lead
var leadChatButtonId = cmp.find("settingsAPI").getLiveAgentSettings().liveAgentButtonId;
var accountChatButtonId= "5730a000000Tbli";

if (fields[key].name == "Manufacturer__c") {
  fields[key].value = isLead ? leadChatButtonId : accountChatButtonId;
}


      if (
        fields[key].value != undefined &&
        fields[key].value != "" &&
        fields[key].value != null
      ) {
       
        //obj[fields[key].name] = fields[key].value;


        if (fields[key].name == "Country") {
          fields[key].name = "Country_Chat__c";
        }
        if (fields[key].name == "Email Address") {
          fields[key].name = "email";
        }
        leadList.push(fields[key].value);
      } else {
        
        if (fields[key].name == "FirstName") {
          fieldError = true;  
          cmp.set("v.firstNameError", "true");
        } else if (fields[key].name == "LastName") {
          fieldError = true;
          cmp.set("v.lastNameError", "true");
        
        } else if (fields[key].name == "Country_Chat__c") {
          fieldError = true;
          cmp.set("v.countryError", "true");
        } else if (fields[key].name == "Email") {
          fieldError = true;
          cmp.set("v.emailError", "true");
        }
        
        //alert("Please fill "+fields[key].label);
      }
    }
    if (!fieldError) {
      cmp.set("v.showFields", "false");
      cmp.set("v.showImg", "false");
    }
    //cmp.set("v.showFields","false");
    let checkbox = document.getElementById("checkbox-6");

    //Send field list if no error is present and then only navigate.
    
    let action;
    let isAgree = cmp.get("v.isAgree");
    // If the pre-chat fields pass validation, start a chat

    if (
      cmp.find("prechatAPI").validateFields(fields).valid &&
      !fieldError &&
      isAgree
    ) {
      // insert lead records.
      if (isLead) {

        cmp.set("v.Manufacturer__c", "false");
        cmp.set("v.showImg", "false");
        action = cmp.get("c.insertLeads");
        action.setParams({ leadRecs: JSON.stringify(leadList) });
       
      }
      // Inserts accounts records
      else {
        action = cmp.get("c.insertAccount");
        action.setParams({ accountRecs: JSON.stringify(leadList) });
      }

      action.setCallback(this, function(response) {
        let state = response.getState();

        if (state == "SUCCESS") {
          fields[4].value = response.getReturnValue();
          
            if (!fieldError) {
    
                cmp.find("prechatAPI").startChat(fields);

                //analytics
                try{
                  
                 
                  console.log("ALEX ANALYTICS 1");//fields[4].value)
                  var x= fields[4];
                 
                  Attribution.identify( { 
                    email: "alex@pisrc.com", //fields[2].value,
                    firstName: "alex", //fields[0].value,
                    lastName: "last", //fields[1].value,
                    createdAt: new Date() 
                  });
                  //Attribution.track(event, [properties], [callback]);
                  Attribution.track('test', {
                    revenue: '79.99'
                  });
                  
                  console.log("ALEX ANALYTICS done");
               }catch(ex){console.log( ex)}

            }
          //cmp.set("v.showFields","false");
        } else {
          alert("error while inserting leads");
        }
      });
      
      $A.enqueueAction(action);
    } else {
      
      console.warn("Prechat fields did not pass validation!");
    }
  },

  /**
   * Create an array of field objects to start a chat from an array of pre-chat fields
   *
   * @param fields - Array of pre-chat field Objects.
   * @returns An array of field objects.
   */
  createFieldsArray: function(fields) {
    if (fields.length) {
      return fields.map(
        function(fieldCmp) {

          console.log( fieldCmp.get("v.label") )

          if (fieldCmp.get("v.label") == "Email Address") {
            
            return {
              label: "Email",
              value: fieldCmp.get("v.value"),
              name: "Email"
            };
          } else if (fieldCmp.get("v.label") == "Country") {
            return {
              label: "Country",
              value: fieldCmp.get("v.value"),
              name: "Country_Chat__c"
            };
          } else
            return {
              label: fieldCmp.get("v.label"),
              value: fieldCmp.get("v.value"),
              name: this.fieldLabelToName[fieldCmp.get("v.label")]
            };
        }.bind(this)
      );
    } else {
      return [];
    }
  },

  /**
   * Create an array in the format $A.createComponents expects
   *
   * Example:
   * [["componentType", {attributeName: "attributeValue", ...}]]
   *
   * @param prechatFields - Array of pre-chat field Objects.
   * @returns Array that can be passed to $A.createComponents
   */
  getPrechatFieldAttributesArray: function(prechatFields,cmp) {
    // $A.createComponents first parameter is an array of arrays. Each array contains the type of component being created, and an Object defining the attributes.
    var prechatFieldsInfoArray = [];

    // For each field, prepare the type and attributes to pass to $A.createComponents
    prechatFields.forEach(function(field) {
      var componentName =
        field.type === "inputSplitName" ? "inputText" : field.type;
      var componentInfoArray;

      var attributes;
      if (field.label == "Email") {
 
        componentInfoArray  = ["lightning:input"];
        attributes = {
          "aura:id": "prechatField",
          required: "false",
          label: "Email Address",
          disabled: field.readOnly,
          maxlength: field.maxLength,
          class: field.className,
          value: field.value,
          type: "email"
        };
      } else if (field.label == "Country Chat") {
        
        componentInfoArray  = ["lightning:combobox"];  
        attributes = {
          "aura:id": "prechatField",
          required: "false",
          label: "Country",
          placeholder: "Choose Country",
          class: field.className,
          //value: field.value
          options: field.picklistOptions,
          value:"United States",

          onchange: cmp.getReference("c.handleChange")
         
        };
      
      }else if (field.label == "chatRecordId"){
       
          componentInfoArray  = ["lightning:input"];
           attributes = {
          "aura:id": "prechatField",
          required: "false",
          label: "chatRecordId",
          class: "noDisp",
          value:field.value,
          type:"text" 
        };  
      }else if (field.label == "Manufacturer"){
       
        componentInfoArray  = ["lightning:input"];
         attributes = {
        "aura:id": "prechatField",
        required: "false",
        label: "Manufacturer",
        class: "noDisp",
        value:field.value,
        type:"text" 
      };  
        
      }else {
        componentInfoArray  = ["lightning:input"];
        attributes = {
          "aura:id": "prechatField",
          required: "false",
          label: field.label,
          disabled: field.readOnly,
          maxlength: field.maxLength,
          class: field.className,
          value: field.value
        };
      }

      console.log("attributes are -- ", attributes);
      // Special handling for options for an input:select (picklist) component
        if (field.type === "inputSelect" && field.picklistOptions){
         
        }
        


        



      // Append the attributes Object containing the required attributes to render this pre-chat field
      componentInfoArray.push(attributes);

      // Append this componentInfoArray to the fieldAttributesArray
      prechatFieldsInfoArray.push(componentInfoArray);
    });


    

    return prechatFieldsInfoArray;
  }
});