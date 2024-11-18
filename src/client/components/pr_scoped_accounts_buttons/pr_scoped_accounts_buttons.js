/*
 * pwix:roles/src/client/components/pr_scoped_accounts_buttons/pr_scoped_accounts_buttons.js
 *
 * Have new account / remove account to add accounts to roles
 * 
 * Parms:
 * - enableAdd: a ReactiveVar which enables the 'Add' button
 * - enableEdit: a ReactiveVar which enables the 'Edit' button
 * - enableRemove: a ReactiveVar which enables the 'Remove' button
 * - withEditTree: whether we have the 'Edit tree' button, defaulting to false
 * - withAddAccount: whether we have the 'Add account' button, defaulting to false
 * - withRemoveAccount: whether we have the 'Remove account' button, defaulting to false
 */

import { pwixI18n } from 'meteor/pwix:i18n';

import './pr_scoped_accounts_buttons.html';

Template.pr_scoped_accounts_buttons.helpers({

    // whether the Add button is disabled ?
    addDisabled(){
        return this.enableAdd.get() ? '' : 'disabled';
    },

    // whether the Edit button is disabled ?
    editDisabled(){
        return this.enableEdit.get() ? '' : 'disabled';
    },

    // whether we have the 'Edit tree' button
    haveEditTree(){
        return this.withEditTree === true;
    },

    // whether we have the 'Add account' button
    haveAddAccount(){
        return this.withAddAccount === true;
    },

    // whether we have the 'Remove account' button
    haveRemoveAccount(){
        return this.withRemoveAccount === true;
    },

    // string translation
    i18n( arg ){
        return pwixI18n.label( I18N, arg.hash.key );
    },

    // whether the Remove button is disabled ?
    removeDisabled(){
        return this.enableRemove.get() ? '' : 'disabled';
    }
});
