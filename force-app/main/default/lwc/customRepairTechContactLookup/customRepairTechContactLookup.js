


import {api, LightningElement, track} from 'lwc';
import { auraExceptionHandler } from "c/auraExceptionHandler";
import getContactsUnderAccount from "@salesforce/apex/RecallFormCustomFieldController.getContactsUnderAccount";
import getDisplayedField from "@salesforce/apex/RecallFormCustomFieldController.getDisplayedField";

export default class CustomRepairTechContactLookup extends LightningElement {

  @track contactList;
  @api currentContactId;
  @api accountId;
  @api accountName;
  @api noContactSelected;

  contactName;
  searchTimeout;
  showResults;
  dropdownClosed;
  hasResults = false;
  isLoading = false;
  selectedContact;
  _clickHandler;
  _invalidContact
  contactObject = {};
  customSearchClass = '';

  async connectedCallback() {
    //Handle closing search results when clicking outside dropdown
    document.addEventListener('click', this._clickHandler = this.closeDropdown.bind(this));
    if(this.currentContactId) {
      const contactName = await getDisplayedField({
        recordId: this.currentContactId,
        fieldName: "Name",
        objectName: "Contact"
      });
      this.contactObject = {
        Id: this.currentContactId,
        Name: contactName
      }
      this.contactName = contactName;
      this.selectedContact = true;
    }
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._clickHandler);
  }

  get disableSearch() {
    return this.selectedContact || !this.accountId;
  }

  get getDropdownClass() {
    let css = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ';
    if (this.showResults) {
      css += 'slds-is-open';
    }
    return css;
  }

  @api
  checkValidity() {
    this.template.querySelector('.searchRepair').reportValidity();
  }

  @api
  get invalidContact() {
    return this._invalidContact;
  }

  set invalidContact(value) {
    this._invalidContact = value;
    this.customSearchClass = value ? 'custom-input-search-error' : '';
  }

  /* Form Actions/Control */
  handleContactSearch(event) {
    let searchString = event.target.value;

    if(searchString === '' && this.selectedContact) {
      this.removeSelectedContact();
    } else {
      this.validateFields();
      this.selectedContact = false;
      this.hasResults = true;
      this.showResults = searchString.length > 0;

      if(this.showResults) {
        this.isLoading = true;
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(this.searchContacts.bind(this, searchString), 500);
      }
    }
  }

  searchContacts(searchString) {
    getContactsUnderAccount({ searchString: searchString, parentAccountId: this.accountId })
      .then(res => {
        this.isLoading = false;
        this.contactList = res;
        this.hasResults = this.contactList.length > 0;
      })
      .catch(error => {
        auraExceptionHandler.logAuraException(error);
      });
  }

  handleOnClick(event) {
    event.stopPropagation();
    this.dropdownClosed = false;
  }

  closeDropdown() {
    if(!this.dropdownClosed) {
      this.showResults = false;
      this.dropdownClosed = true;
    }
  }

  /* Form Validation */
  validateFields() {
    this.template.querySelectorAll('lightning-input').forEach(element => {
      element.reportValidity();
    });
  }

  /* Events */
  removeSelectedContact() {
    this.selectedContact = false;
    this.contactName = '';
    this.contactObject = {};
    this.fireContactDeselectionEvent();
  }

  selectContact(event) {
    this.contactObject = this.contactList[event.currentTarget.dataset.index];
    this.selectedContact = true;
    this.contactName = this.contactList[event.currentTarget.dataset.index].Name;
    this.showResults = false;
    this.fireContactSearchResultSelectionEvent(this.contactObject);

    // Remove required validation message/styling
    Promise.resolve().then(() => {
      this.validateFields();
    });
  }

  fireContactDeselectionEvent() {
    const contactDeselectionEvent = new CustomEvent('contactdeselection', {
      detail: '' ,
    });
    // Fire the custom event
    this.dispatchEvent(contactDeselectionEvent);
  }

  fireContactSearchResultSelectionEvent(selectedContact) {
    const contactSearchResultSelectionEvent = new CustomEvent('contactresultselection', {
      detail: { selectedContact },
    });
    // Fire the custom event
    this.dispatchEvent(contactSearchResultSelectionEvent);
  }

  /* Helpers */
  logProxy(msg, data) {
    console.log(msg, JSON.parse(JSON.stringify(data)));
  }

}