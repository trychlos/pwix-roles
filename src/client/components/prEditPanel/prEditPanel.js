/*
 * /imports/client/components/prEditPanel/prEditPanel.js
 *
 *  Edit the roles of the specified user.
 * 
 *  Parms:
 *  - id: optional, the user identifier
 *  - user: optional, the user full record
 *  - roles: optional, a reactive var which is expected to contain the initial array of attributed roles
 * 
 *  Order of precedence is:
 *  1. id
 *  2. user
 *  3. roles
 * 
 *  If 'id' is specified, this is enough and the component takes care of read the attributed roles of the identified user.
 *  Else, if user is identified, then the component takes care of read the attributed roles of the user.
 *  Else, if roles are specified, then they are edited from this var.
 * 
 *  If none of these three parms is specified, then the edition begins with an empty state.
 */

import '../edit_global_pane/edit_global_pane.js';
import '../edit_scoped_pane/edit_scoped_pane.js';

import './prEditPanel.html';

Template.prEditPanel.onCreated( function(){
    const self = this;

    self.PR = {
        // define constants used both here and in underlying panels
        global_div: 'pr-global',
        global_prefix: 'prglobal_',
        scoped_div: 'pr-scoped',
        //scoped_prefix: 'prscoped_'
    };

    // when this component is created, then declare the function to get back its values
    Roles.EditPanel = {
        /**
         * @returns {Array} the list of roles checked in the prEditPanel
         */
        checked(){
            let checked = [];
            self.$( '.'+self.PR.global_div ).jstree( true ).get_checked_descendants( '#' ).every(( id ) => {
                checked.push( id.replace( self.PR.global_prefix, '' ));
                return true;
            });
            const filtered = Roles._filter( checked );
            //console.log( 'checked', checked, 'filtered', filtered );
            return filtered;
        }
    };
});

Template.prEditPanel.helpers({
    // whether the defined roles hierarchy includes scoped roles ?
    //  when yes, then presents a tabbed panel separating global (non-scoped) roles from scoped ones
    haveScopes(){
        return Roles.scopedRoles().length > 0;
    },

    // parms specific to global (non-scoped) roles edition pane
    parmsGlobalPane(){
        return {
            ...this,
            global_div: Template.instance().PR.global_div,
            global_prefix: Template.instance().PR.global_prefix
        };
    },

    // parms for the Tabbed component when we have both non-scoped and scoped roles
    parmsTabbed(){
        return {
            tabs: [
                {
                    tabid: 'global_tab',
                    paneid: 'global_pane',
                    navLabel: pwixI18n.label( I18N, 'tabs.global_title' ),
                    paneTemplate: 'edit_global_pane',
                    paneData: {
                        ...this,
                        pr_div: Template.instance().PR.global_div,
                        pr_prefix: Template.instance().PR.global_prefix
                    }
                },
                {
                    tabid: 'scoped_tab',
                    paneid: 'scoped_pane',
                    navLabel: pwixI18n.label( I18N, 'tabs.scoped_title' ),
                    paneTemplate: 'edit_scoped_pane',
                    paneData: {
                        ...this,
                        pr_div: Template.instance().PR.scoped_div
                    }
                }
            ]
        };
    }
});
