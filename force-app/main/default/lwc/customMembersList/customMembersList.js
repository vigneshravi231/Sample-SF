

import { LightningElement, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { auraExceptionHandler } from "c/auraExceptionHandler";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import fetchAllMembers from "@salesforce/apex/CustomMembersListController.fetchAllMembers";
import getWebsiteUrl from "@salesforce/apex/CommunityController.getWebsiteUrl";
import setUserActivation from "@salesforce/apex/CustomMembersListController.setUserActivation";
import resetPassword from "@salesforce/apex/CustomMembersListController.resetPassword";
import getCurrentPermissionAssignments from "@salesforce/apex/CustomMembersListController.getCurrentPermissionAssignments";
import updatePermissionSets from "@salesforce/apex/CustomMembersListController.updatePermissionSets";
import getAssignableProfiles from "@salesforce/apex/CustomMembersListController.getAssignableProfiles";
import getDealerInfoById from "@salesforce/apex/CustomMembersListController.getDealerInfoById";
import getContactInformation from "@salesforce/apex/CustomMembersListController.getContactInformation";
import {uuidv4} from "c/utils";

import { ContextProvider } from "c/communityContextProvider";

export default class CustomMembersList extends NavigationMixin(ContextProvider(LightningElement)) {

  @track pagination = {
    firstPage: 1,
    pageSize: 10,
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0
  };

  @track selectedRecordId;
  @track showRecordEditForm = false;

  currentPermissions = [];
  @track permissionOptions = [
    {
      label: "Buyer Persona 1",
      value: "Buyer_Persona_1"
    }, {
      label: "Buyer Persona 2",
      value: "Buyer_Persona_2"
    }, {
      label: "Buyer Persona 3",
      value: "Buyer_Persona_3"
    }, {
      label: "Administrator Persona",
      value: "Administrator_Persona"
    }, {
      label: "Requisitioner Persona",
      value: "Requisitioner_Persona"
    }
  ];
  @track showPermissionsBox = false;
  @track selectedPermissions = [];
  @track unassignedPermissions = [];
  @track assignedPermissions = [];

  @track displayData = [];
  @track isLoading = false;

  @track editFormLoading = true;

  @track selectedContactId;
  @track createContactFormOpen = false;
  @track contactFormLoading = true;

  columns = [
    {
      label: "Full Name",
      fieldName: "DirectLink",
      type: "url",
      typeAttributes: {
        label: {
          fieldName: "Name"
        },
        value: {
          fieldName: "Name"
        },
        target: "DirectLink"
      }
    },
    {
      label: "Email",
      fieldName: "Email",
      type: "email",
      sortable: true
    },
    {
      label: "Title",
      fieldName: "Title",
      sortable: true
    },
    {
      label: "Persona",
      fieldName: "PersonaDisplayName",
      sortable: true
    },
    {
      label: "Active",
      fieldName: "IsActive",
      type: "boolean",
      sortable: true
    },
    {
      type: "action",
      typeAttributes: { rowActions: this.getRowActions }
    }
  ];

  siteUrl;

  selectedProfileId;
  profileOptions = [];

  defaultSortDirection = "asc";
  sortDirection = "asc";
  sortedBy;

  // Contact Preloaded Information
  dealerId;
  defaultShippingAddress = {};

  // User Information after creating a contact
  userFirstName;
  userLastName;
  userEmail;
  userAlias;
  userUsername;

  accountId;

  get validProfile() {
    return !!this.selectedProfileId;
  }

  get recordEditFormHeader() {
    return this.selectedRecordId !== null ? 'Edit User' : 'New User';
  }

  async connectedCallback() {
    try {
      this.siteUrl = await getWebsiteUrl();
      const profiles = await getAssignableProfiles();
      this.profileOptions = profiles.map(item => {
        return {
          label: item.Name,
          value: item.Id
        }
      });
      this.selectedProfileId = profiles?.[0].Id;
      await this.search();
    } catch (err) {
      auraExceptionHandler.logAuraException(err);
    }
  }

  async search() {
    this.isLoading = true;

    const { records, settings } = await fetchAllMembers({
      input: {
        pagination: this.pagination,
        query: this.query,
        sortedBy: this.sortedBy,
        sortDirection: this.sortDirection,
      }
    });

    this.pagination = settings;
    this.displayData = records.map((item) => this.formatInfo(item));

    this.isLoading = false;
  }

  getRowActions(row, doneCallback) {
    if(row.IsActive) {
      doneCallback([
        {
          label: "Deactivate",
          name: "deactivate"
        }, {
          label: "Edit Member",
          name: "edit"
        }, {
          label: "Reset Password",
          name: "reset"
        }, {
          label: "Manage Permissions",
          name: "manage"
        },
        {
          label: "Setup Related Accounts",
          name: "setupAccounts"
        }

      ]);
    } else {
      doneCallback([
        {
          label: "Activate",
          name: "activate"
        }, {
          label: "Edit Member",
          name: "edit"
        }
      ]);
    }
  }

  async handlePaginationChange(event) {
    this.isLoading = true;

    const paginationDiff = event.detail;

    this.pagination = {
      ...this.pagination,
      ...paginationDiff
    };

    await this.search();

    this.isLoading = false;
  }

  formatInfo(object) {
    return {
      ...object,
      DirectLink: this.siteUrl + "/s/profile/" + object.Id,
      PersonaDisplayName: object.B2B_Buyer_Persona__c?.replaceAll('_', ' ')
    };
  }

  async onHandleSort(event) {
    const { fieldName: sortedBy, sortDirection } = event.detail;
    this.sortDirection = sortDirection;
    this.sortedBy = sortedBy;

    await this.search();
  }

  addMember() {
    this.showRecordEditForm = true;
    this.selectedRecordId = null;
  }

  openContactForm() {
    this.createContactFormOpen = true;
    this.showRecordEditForm = false;

    this.prepopulateAccountFields();
  }

  closeContactForm() {
    if(!this.selectedContactId) {
      this.userFirstName = '';
      this.userLastName = '';
      this.userEmail = '';
      this.userUsername = '';
      this.userAlias = '';
    }
    this.createContactFormOpen = false;
    this.showRecordEditForm = true;
  }

  onProfileSelect(event) {
    this.selectedProfileId = event.detail.value;
  }

  submitContactForm() {
    const hiddenButton = this.template.querySelector('.contact');

    if(hiddenButton) {
      hiddenButton.click();
    }
  }

  prepopulateAccountFields() {
    getDealerInfoById({ recordId: null }) // take default account associated with user
      .then(result => {
        this.accountId = result.Id;
        this.dealerId = result.AccountNumber;
        this.defaultShippingAddress = result.ContactPointAddresses?.[0];
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }

  onContactLoad() {
    this.contactFormLoading = false;
  }

  onContactSubmit(event) {
    event.preventDefault();
    const fields = event.detail.fields;
    this.userFirstName = fields.FirstName;
    this.userLastName = fields.LastName;
    this.userEmail = fields.Email;
    this.userUsername = fields.Email + '.bac';
    this.userAlias = (fields.FirstName?.[0] || '' + this.userLastName?.substr(0,4)).toLowerCase();
    fields.AccountId = this.accountId;
    this.template.querySelector('[data-id=contact]').submit(fields);
    this.contactFormLoading = true;
  }

  onContactSuccess(event) {
    this.selectedContactId = event.detail.id;
    this.contactFormLoading = false;
    this.closeContactForm();
  }

  onContactError() {
    this.fireToastEvent(
      'Error',
      'An error has occurred. Please contact your Salesforce admin.',
      'error'
    );
    this.contactFormLoading = false;
  }

  handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    switch (actionName) {
      case "deactivate":
      case "activate":
        this.setUserActivation(row);
        break;

      case "edit":
        this.editMember(row);
        break;

      case "reset":
        this.resetMemberPassword(row);
        break;

      case "manage":
        this.openManagePermissions(row);
        break;
      case "setupAccounts":
        console.log('ahoj');
        this.openSetupAccountsModal(row)
        break;
      default:
    }
  }

  openSetupAccountsModal(row){
    this.template.querySelector('c-add-account-relation-modal').open(row);
  }

  setUserActivation(row) {
    const { Id } = row;
    setUserActivation({ userId: Id })
      .then(async result => {
        this.fireToastEvent(
          'Success!',
          `User has been ${result ? 'activated' : 'deactivated'}.`,
          'success'
        );
        await this.search();
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }

  editMember(row) {
    const { Id } = row;
    this.selectedRecordId = Id;
    this.showRecordEditForm = true;
  }

  resetMemberPassword(row) {
    const { Id } = row;
    resetPassword({ userId: Id })
      .then(() => {
        this.fireToastEvent(
          'Success!',
          'An email has been sent to the user to reset their password.',
          'success'
        );
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }

  openManagePermissions(row) {
    const { Id } = row;
    this.isLoading = true;
    this.selectedRecordId = Id;
    getCurrentPermissionAssignments({ userId: Id })
      .then(result => {
        console.log(result, 'current permissions');
        this.currentPermissions = result.map(item => item.PermissionSet.Name);
        this.selectedPermissions = this.currentPermissions;
        this.showPermissionsBox = true;
      })
      .catch(error => auraExceptionHandler.logAuraException(error))
      .finally(() => {
        this.isLoading = false;
      });
  }

  submitRecordEditForm() {
    const hiddenButton = this.template.querySelector('.user');

    if(hiddenButton) {
      hiddenButton.click();
    }
  }

  closeRecordEditModal() {
    this.showRecordEditForm = false;
  }

  onContactSelect(event) {
    const recordId = event.detail.value[0];
    getContactInformation({ recordId })
      .then(result => {
        this.userFirstName = result.FirstName;
        this.userLastName = result.LastName;
        this.userEmail = result.Email;
        this.userUsername = result.Email + '.bac';
        this.userAlias = (result.FirstName?.[0] + this.userLastName?.substr(0,4)).toLowerCase();
      })
      .catch(error => auraExceptionHandler.logAuraException(error));
  }

  onLoad() {
    this.editFormLoading = false;
  }

  onSubmit(event) {
    event.preventDefault();
    const fields = event.detail.fields;
    fields.ProfileId = this.selectedProfileId;
    fields.CommunityNickname = `${fields.Alias || ''}${uuidv4()}`;
    this.template.querySelector('[data-id=user]').submit(fields);
    this.editFormLoading = true;
  }

  onSuccess() {
    this.fireToastEvent(
      'Success!',
      `Successfully ${this.selectedRecordId != null ? 'updated the' : 'added a new'} member.`,
      'success'
    );
    this.editFormLoading = false;
    this.showRecordEditForm = false;
    this.selectedContactId = null;
  }

  onError() {
    this.fireToastEvent(
      'Error',
      'An error has occurred. Please contact your Salesforce admin.',
      'error'
    );
    this.editFormLoading = false;
  }

  closePermissionsModal() {
    this.showPermissionsBox = false;
  }

  onPermissionSetChange(event) {
    this.selectedPermissions = event.detail.value;
  }

  savePermissionChanges() {
    const assigningAdminPersona = this.assignedPermissions.includes('Administrator_Persona');
    // console.log(assigningAdminPersona, 'assigning admin?');
    // console.log(JSON.parse(JSON.stringify(this.assignedPermissions)), 'assigning');
    // console.log(JSON.parse(JSON.stringify(this.unassignedPermissions)), 'unassigning');
    const unassignedArr = [], assignedArr = [];
    for(let i = 0; i < this.selectedPermissions.length; ++i) {
      if(!this.currentPermissions.includes(this.selectedPermissions[i])) {
        assignedArr.push(this.selectedPermissions[i]);
      }
    }
    for(let i = 0; i < this.currentPermissions.length; ++i) {
      if(!this.selectedPermissions.includes(this.currentPermissions[i])) {
        unassignedArr.push(this.currentPermissions[i]);
      }
    }
    if(assignedArr.length > 0 || unassignedArr.length > 0) {
      this.isLoading = true;

      updatePermissionSets({
        userId: this.selectedRecordId,
        assignedPermissions: assignedArr,
        unassignedPermissions: unassignedArr,
        assigningAdminPersona
      })
        .then(result => {
          this.fireToastEvent(
            'Success!',
            'Permissions have been updated.',
            'success'
          );
        })
        .catch(error => auraExceptionHandler.logAuraException(error))
        .finally(() => {
          this.isLoading = false;
          this.showPermissionsBox = false;
        });
    }
  }

  fireToastEvent(title, message, variant) {
    const evt = new ShowToastEvent({
      title,
      message,
      variant
    });
    this.dispatchEvent(evt);
  }
}
