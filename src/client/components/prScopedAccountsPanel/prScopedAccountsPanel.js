/*
 * pwix:roles/src/client/components/prScopedAccountsPanel/prScopedAccountsPanel.js
 *
 *  This panel *displays* the scoped roles with the corresponding accounts.
 *  Unless configured otherwise, it let the user edit these accounts for each scoped role.
 * 
 *  This is to be run by a TenantManager-role account.
 * 
 * Parms:
 *  - scope: the to-be-edited scope
 *  - editAllowed: whether we allow the edition of the scoped accounts, defaulting to true
 */

import _ from 'lodash';

import '../pr_scoped_accounts_panel/pr_scoped_accounts_panel.js';

import './prScopedAccountsPanel.html';

Template.prScopedAccountsPanel.helpers({
    // parms for pr_scoped_accounts_panel - view mode
    parmsPanel(){
        return {
            scope: this.scope,
            editAllowed: Boolean( this.editAllowed !== false ),
            editMode: false,
            pr_selectable: false
        };
    }
});
