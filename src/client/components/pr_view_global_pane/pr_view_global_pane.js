/*
 * pwix:roles/src/client/components/pr_view_global_pane/pr_view_global_pane.js
 *
 *  Edit global (non-scoped) roles.
 * 
 *  Parms:
 *  - roles: a ReactiveVar which contains the user roles, as an object { scoped: { <scope>: { all<Array>, direct<Array } }, global: { all<Array>, direct<Array } }
 *      (a deep copy of the user roles - so can be edited)
 *  - pr_div: the class name of the main div
 *  - pr_prefix: the prefix of the checkbox nodes
 */

import { pwixI18n } from 'meteor/pwix:i18n';

import './pr_view_global_pane.html';

Template.pr_view_global_pane.helpers({

    // whether we have some global roles to show
    haveGlobal( arg ){
        return this.roles.get().global.direct.length > 0;
    },

    // string translation
    i18n( arg ){
        return pwixI18n.label( I18N, arg.hash.key );
    },

    // parms to the pr_tree component to edit global roles
    parmsTree(){
        return {
            ...this,
            pr_editable: false,
            pr_selectable: false
        };
    }
});
