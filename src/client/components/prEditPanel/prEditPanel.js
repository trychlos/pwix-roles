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

import '../edit_non_scoped_pane/edit_non_scoped_pane.js';
import '../edit_scoped_pane/edit_scoped_pane.js';

import './prEditPanel.html';

Template.prEditPanel.helpers({
    // parms for the Tabbed component when we have both non-scoped and scoped roles
    haveScopes(){
        return Roles.scopedRoles().length > 0;
    },

    // parms for the Tabbed component when we have both non-scoped and scoped roles
    parmsTabbed(){
        return {
            tabs: [
                {
                    tabid: 'non_scoped_tab',
                    paneid: 'non_scoped_pane',
                    navLabel: pwixI18n.label( I18N, 'tabs.non_scoped_title' ),
                    paneTemplate: 'edit_non_scoped_pane'
                },
                {
                    tabid: 'scoped_tab',
                    paneid: 'scoped_pane',
                    navLabel: pwixI18n.label( I18N, 'tabs.scoped_title' ),
                    paneTemplate: 'edit_scoped_pane'
                }
            ]
        };
    }
});
