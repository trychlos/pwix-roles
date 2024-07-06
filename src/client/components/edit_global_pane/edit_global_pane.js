/*
 * /imports/client/components/edit_global_pane/edit_global_pane.js
 *
 *  Edit global (non-scoped) roles.
 * 
 *  Parms:
 *  - roles: a ReactiveVar which contains the user roles, as an object { scoped: { <scope>: { all<Array>, direct<Array } }, global: { all<Array>, direct<Array } }
 *      (a deep copy of the user roles - so can be edited)
 *  - pr_div: the class name of the main div
 *  - pr_prefix: the prefix of the checkbox nodes
 */

import './edit_global_pane.html';

Template.edit_global_pane.helpers({
    // parms to the pr_tree component to edit global roles
    parmsTree(){
        return {
            ...this
        };
    }
});

Template.edit_global_pane.events({
    'pr-change .pr-edit-global-pane'( event, instance ){
        const roles = Roles.EditPanel.global();
        instance.$( event.currentTarget ).trigger( 'pr-global-state', { roles: roles });
    }
});
