/*
 * /imports/client/components/edit_scoped_pane/edit_scoped_pane.js
 *
 *  Edit scoped roles.
 * 
 *  Parms:
 *  - id: optional, the user identifier
 *  - user: optional, the user full record
 *  - roles: optional, a reactive var which is expected to contain the initial array of attributed roles
 * +
 *  - pr_div: the name of the main div
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

import _ from 'lodash';

import { pwixI18n } from 'meteor/pwix:i18n';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { Roles } from 'meteor/pwix:roles';

import './edit_scoped_pane.html';
/*
 * pwix:accounts-manager/src/client/components/edit_scoped_pane/edit_scoped_pane.js
 *
 * Parms:
 * - item: a ReactiveVar which holds the account object to edit (may be empty, but not null)
 * - isNew: true|false
 * - checker: a ReactiveVar which holds the parent Checker
 */

import './edit_scoped_pane.html';

const NONE = 'NONE';

Template.edit_scoped_pane.onCreated( function(){
    const self = this;

    self.AM = {
        //handle: self.subscribe( 'organizations.listAll' ),
        // the original version of the user roles
        userRoles: null,
        // the current edition state
        edited: new ReactiveVar( [] ),
        // the full available - defined - roles
        availableRoles: _.cloneDeep( Roles.flat()),
        // the edited roles
        editedRoles: new ReactiveVar( [] ),

        // returns the identified index in the 'edited' array
        getRole( rowId ){
            let roles = self.AM.edited.get();
            found = -1;
            for( let i=0 ; i<roles.length && found<0 ; ++i ){
                if( roles[i].DYN.rowid === rowId ){
                    found = i;
                }
            }
            if( found < 0 ){
                console.warn( 'role not found', rowId );
            }
            return found;
        },

        // initialize a new editable role object
        //  the role object is the document as returned from Roles.getRolesForUser()
        //  we allocate an object with:
        //  - rowid: a random id which uniquely identify the row
        //  - doc: the { _id, scope } role object as returned from Roles.getRolesForUser() or edited
        //      _id and scope are null for an unitialized row
        //  - DYN: some dyn variables
        newRole( o ){
            return {
                doc: { ...o },
                DYN: {
                    rowid: 'row-'+Random.id(),
                    scopeLabel: new ReactiveVar( pwixI18n.label( I18N, 'accounts.panel.no_role' )),
                    scopeEnabled: new ReactiveVar( false ),
                    scopeSelected: new ReactiveVar( NONE ),
                    lineValid: new ReactiveVar( false )
                }
            }
        },

        // a new role has been selected - reset the scope select box accordingly
        resetScope( roleObj ){
            let label = pwixI18n.label( I18N, 'accounts.panel.no_role' );
            let want_scope = false;
            if( roleObj.doc._id ){
                const o = self.AM.availableRoles[roleObj.doc._id];
                if( o && o.scoped === true ){
                    label = pwixI18n.label( I18N, 'accounts.panel.with_scope' );
                    want_scope = true;
                } else {
                    label = pwixI18n.label( I18N, 'accounts.panel.without_scope' );
                }
            }
            roleObj.DYN.scopeEnabled.set( want_scope );
            roleObj.DYN.scopeLabel.set( label );
            roleObj.DYN.scopeSelected.set( want_scope && roleObj.doc.scope ? roleObj.doc.scope : NONE );
        },

        // a new role has been selected - update the line accordingly
        //  role may be null on new row
        selectRole( rowId, roleName ){
            const idx = self.AM.getRole( rowId );
            if( idx >= 0 ){
                let roleObj = self.AM.edited.get()[idx];
                roleObj.doc._id = roleName;
                self.AM.resetScope( roleObj );
                self.AM.updateCheck( roleObj );
            }
        },

        // a new scope has been selected - update the line accordingly
        selectScope( rowId, scope ){
            const idx = self.AM.getRole( rowId );
            if( idx >= 0 ){
                let roleObj = self.AM.edited.get()[idx];
                roleObj.doc.scope = scope;
                self.AM.updateCheck( roleObj );
            }
        },

        // send panel data
        sendPanelData( data, ok ){
            self.$( '.c-account-roles-panel' ).trigger( 'panel-data', {
                emitter: 'roles',
                data: data,
                ok: ok
            });
        },

        // check the line when both role and scope are valid
        updateCheck( roleObj ){
            const roleValid = Boolean( roleObj.doc._id && roleObj.doc._id.length > 0 );
            let scopeValid = false;
            if( roleValid ){
                scopeValid = ( self.AM.availableRoles[roleObj.doc._id].scoped === true ) ? roleObj.doc.scope !== null : roleObj.doc.scope === null;
            }
            //console.debug( roleObj, 'roleValid', roleValid, 'scopeValid', scopeValid );
            roleObj.DYN.lineValid.set( roleValid && scopeValid );
        }
    };

    // get user roles as an array
    // have a deep copy which is the starting point of the edition
    Roles.getRolesForUser( Template.currentData().item.get())
        .then(( res ) => {
            self.AM.userRoles = res;
            let edit = [];
            res.every(( role ) => {
                edit.push( self.AM.newRole( role ));
                return true;
            });
            self.AM.edited.set( edit );
        });

    // track the edited roles
    self.autorun(() => {
        console.debug( self.AM.editedRoles.get())
    });
});

Template.edit_scoped_pane.onRendered( function(){
    const self = this;

    // track the edited roles and advertizes listeners
    self.autorun(() => {
        let data = [];
        let ok = true;
        self.AM.edited.get().every(( o ) => {
            ok &&= o.DYN.lineValid.get();
            data.push( o.doc );
            return true;
        });
        self.AM.sendPanelData( data, ok );
    });
});

Template.edit_scoped_pane.helpers({
    // the name of the main div
    divClass(){
        return this.pr_div;
    },

    // the roles attributed to this user
    editedList(){
        return Template.instance().AM.edited.get();
    },

    // string translation
    i18n( arg ){
        return pwixI18n.label( I18N, arg.hash.key );
    },

    // list of known organizations
    organizationsList(){
        /*
        const APP = Template.instance().AM;
        if( APP.handle.ready()){
            const raw = Organizations.find().fetch();
            const grouped = Meteor.AM.Validity.group( raw, { id: 'entity' });
            return grouped;
        }
            */
        return [];
    },

    // closest label of the organization
    orgLabel( it ){
        const closest = Meteor.AM.Validity.closest( it.items )
        return closest.record.label;
    },

    // parms for prEditPanel roles edition panel
    parmsRoles(){
        return {
            roles: Template.instance().AM.editedRoles
        };
    },

    // the available roles as an array
    rolesList(){
        return Object.values( Template.instance().AM.availableRoles );
    },

    // disable the global roles already selected (scoped roles may be chosen several times expecting different scopes)
    roleDisabled( roleObj, optionRole ){
        let disabled = false;
        Template.instance().AM.edited.get().every(( o ) => {
            if( o.doc._id === optionRole.name && optionRole.scoped !== true ){
                disabled = true;
            }
            return disabled === false;
        });
        return disabled ? 'disabled' : '';
    },

    // whether this role must be initially selected
    //  if the initial roles list is empty or this is a new role row, then select NONE
    //  else select the corresponding item
    roleSelected( roleObj, optionRole ){
        let selected = false;
        if( roleObj.doc._id ){
            selected = ( optionRole.name === roleObj.doc._id );
        } else {
            selected = ( optionRole.name === NONE );
        }
        if( selected ){
            Template.instance().AM.selectRole( roleObj.DYN.rowid, roleObj.doc._id );
        }
        return selected ? 'selected' : '';
    },

    // whether the scope selection is enabled
    scopeDisabled( it ){
        return it.DYN.scopeEnabled.get() ? '' : 'disabled';
    },

    // display a different label depending o the currently selected role
    scopeLabel( it ){
        return it.DYN.scopeLabel.get();
    },

    // the scope option to be selected has been computed when the role has been selected
    scopeSelected( roleObj, itOrg ){
        const wanted = roleObj.DYN.scopeSelected.get() || NONE;
        if( wanted === NONE ){
            selected = itOrg === NONE;
        } else {
            selected = ( itOrg.entity === wanted );
        }
        return selected ? 'selected' : '';
    },

    // display a check if the line is valid
    transparentIfNotValid( it ){
        return it.DYN.lineValid.get() ? '' : 'x-transparent';
    }
});

Template.edit_scoped_pane.events({
    // clear the panel to initialize a new account
    'clear-panel .c-account-roles-panel'( event, instance ){
        instance.AM.edited.set( [] );
    },

    // change the currently selected role
    //  update the label of the scope box accordingly
    'change .js-role'( event, instance ){
        const rowId = instance.$( event.currentTarget ).closest( 'tr' ).data( 'row-id' );
        const role = instance.$( 'tr[data-row-id="'+rowId+'"]' ).find( '.js-role :selected' );
        //console.debug( 'rowId', rowId, 'role', role.val());
        instance.AM.selectRole( rowId, role.val());
    },

    // change the currently selected scope
    'change .js-scope'( event, instance ){
        const rowId = instance.$( event.currentTarget ).closest( 'tr' ).data( 'row-id' );
        const scope = instance.$( 'tr[data-row-id="'+rowId+'"]' ).find( '.js-scope :selected' );
        instance.AM.selectScope( rowId, scope.val());
    },

    // add a new line to enter a new role
    'click .js-plus'( event, instance ){
        let roles = instance.AM.edited.get();
        roles.push( instance.AM.newRole({ _id: null, scope: null }));
        instance.AM.edited.set( roles );
        return false;
    },

    // remove the current role
    'click .js-minus'( event, instance ){
        const rowId = instance.$( event.currentTarget ).closest( 'tr' ).data( 'row-id' );
        const idx = instance.AM.getRole( rowId );
        if( idx >= 0 ){
            let roles = instance.AM.edited.get();
            roles.splice( idx, 1 );
            instance.AM.edited.set( roles );
        }
        return false;
    },

    // select/unselect a role
    'pr-edit-state .c-account-roles-panel'( event, instance, data ){
        console.debug( event, data );
    }
});
