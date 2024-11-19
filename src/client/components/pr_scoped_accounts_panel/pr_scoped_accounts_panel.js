/*
 * pwix:roles/src/client/components/pr_scoped_accounts_panel/pr_scoped_accounts_panel.js
 *
 *  This panel can view or edit the scoped roles with the corresponding accounts.
 *  In view mode, an 'edit scoped accounts' button is displayed, which runs an edit dialog.
 *  In edit mode, 'add account' and 'remove account' buttons are displayed.
 * 
 *  This is to be run by a TenantManager-role account.
 * 
 * Parms:
 *  - scope: the to-be-edited scope
 *  - editMode: whether we are running in edit mode, defaulting to true
 *  - editAllowed: when in view mode (editMode=false), whether the caller allows the edition mode to be run, defaulting to true
 *  - roles: a ReactiveVar, computed in view mode, passed to edit mode
 *  - accountsAssignments: a ReactiveVar, computed in view mode, passed to edit mode
 */

import _ from 'lodash';

import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';

import '../pr_scoped_accounts_dialog/pr_scoped_accounts_dialog.js';
import '../pr_scoped_accounts_buttons/pr_scoped_accounts_buttons.js';
import '../pr_tree/pr_tree.js';


import './pr_scoped_accounts_panel.html';

Template.pr_scoped_accounts_panel.onCreated( function(){
    const self = this;

    self.PR = {
        // define constants used both here and in underlying panels
        scoped_div: 'pr-scoped',
        scope: new ReactiveVar( null ),

        // whether we are in edition mode ?
        editMode: new ReactiveVar( false ),

        // in view mode, the current user and its (scoped) roles
        userRoles: new ReactiveVar( null ),
        userId: null,
        userHandle: new ReactiveVar( null ),

        // in view mode, the current scoped accounts
        accountsAssignments: new ReactiveVar( null ),
        accountsHandle: new ReactiveVar( null ),
        // the current accounts selection
        accountsSelected: new ReactiveVar( null ),

        // whether the buttons are enabled
        enableAdd: new ReactiveVar( false ),
        enableEdit: new ReactiveVar( false ),
        enableRemove: new ReactiveVar( false ),

        // last row selected
        selectedNode: new ReactiveVar( null ),
        // full selection
        selectedArray: new ReactiveVar( null ),
    };

    // keep the scope as the event handlers data context are those of the sender
    self.autorun(() => {
        self.PR.scope.set( Template.currentData().scope );
    });

    // whether we run in edition mode ?
    self.autorun(() => {
        self.PR.editMode.set( Template.currentData().editMode !== false );
    });

    // the 'edit tree' button is enabled when in view mode and edition is allowed
    self.autorun(() => {
        self.PR.enableEdit.set( Template.currentData().editMode === false && Template.currentData().editAllowed !== false );
    });

    // in view mode, subscribe to the current user assigned roles
    //  in edit mode, these same roles are passed in the data context
    self.autorun(() => {
        if( self.PR.editMode.get()){
            self.PR.userRoles.set( Template.currentData().roles );
        } else {
            self.PR.userId = Meteor.userId();
            if( self.PR.userId ){
                self.PR.userHandle.set( self.subscribe( 'pwix_roles_user_assignments', self.PR.userId ));
            }
        }
    });

    // in view mode, get the scoped roles of the current user
    self.autorun(() => {
        if( !self.PR.editMode.get()){
            const handle = self.PR.userHandle.get();
            if( handle && handle.ready()){
                let roles = { scoped: {}, global: { all: [], direct: [] }};
                const _setup = function( it, o ){
                    o.all = o.all || [];
                    o.direct = o.direct || [];
                    o.direct.push( it.role._id );
                    if( it.inheritedRoles && _.isArray( it.inheritedRoles )){
                        it.inheritedRoles.forEach(( role ) => {
                            o.all.push( role._id );
                        });
                    }
                };
                Roles.getRolesForUser( self.PR.userId, { anyScope: true, fullObjects: true }).then(( res ) => {
                    res.forEach(( it ) => {
                        if( it.scope ){
                            roles.scoped[it.scope] = roles.scoped[it.scope] || {};
                            _setup( it, roles.scoped[it.scope] );
                        } else {
                            _setup( it, roles.global );
                        }
                    });
                    self.PR.userRoles.set( roles );
                });
            }
        }
    });

    // in view mode, subscribe to the scoped accounts (accounts which have a role in this scope)
    //  in edit mode, these same accounts are passed in the data context
    self.autorun(() => {
        if( self.PR.editMode.get()){
            self.PR.accountsAssignments = Template.currentData().accounts;
        } else {
            self.PR.accountsHandle.set( self.subscribe( 'pwix_roles_list_by_scope', Template.currentData().scope ));
        }
    });

    // in view mode, get the scoped accounts
    self.autorun(() => {
        if( !self.PR.editMode.get()){
            const handle = self.PR.accountsHandle.get();
            if( handle && handle.ready()){
                Meteor.roleAssignment.find({ scope: Template.currentData().scope }).fetchAsync().then(( fetched ) => {
                    self.PR.accountsAssignments.set( fetched );
                });
            }
        }
    });

    // in edit mode, enable/disable the add/remove account buttons depending of the current selection
    self.autorun(() => {
        const node = self.PR.selectedNode.get();
        self.PR.enableAdd.set( Boolean( node && node.type === 'R' ));
        self.PR.enableRemove.set( Boolean( node && node.type === 'A' ));
    });

    // track the accountsSelected ids
    self.autorun(() => {
        //console.debug( 'accountsSelected', self.PR.accountsSelected.get());
    });
});

Template.pr_scoped_accounts_panel.helpers({

    // parms for the buttons
    parmsButtons(){
        return {
            withEditTree: !Template.instance().PR.editMode.get(),
            enableEdit: Template.instance().PR.enableEdit,
            withAddAccount: Template.instance().PR.editMode.get(),
            enableAdd: Template.instance().PR.enableAdd,
            withRemoveAccount: Template.instance().PR.editMode.get(),
            enableRemove: Template.instance().PR.enableRemove
        };
    },

    // parms specific to tree edition pane
    parmsTree(){
        return {
            roles: Template.instance().PR.userRoles,
            pr_edit: false,
            pr_div: Template.instance().PR.scoped_div+( Template.instance().PR.editMode.get() ? '-edit' : '-view' ),
            pr_selectable: Boolean( this.pr_selectable !== false ),
            pr_multiple: Boolean( this.pr_selectable === true ),
            wantScoped: true,
            scope: this.scope,
            withCheckboxes: false,
            accounts: Template.instance().PR.accountsAssignments,
        };
    }
});

Template.pr_scoped_accounts_panel.events({
    // when we have validated the 'add account' selection dialog
    // replace the accounts assigned to this role by the new selected ones
    'ah-accounts-select .pr-scoped-accounts-panel'( event, instance, data ){
        const node = instance.PR.selectedNode.get();
        let accountsAssignments = [];
        ( instance.PR.accountsAssignments.get() || [] ).forEach(( it ) => {
            if( it.role._id !== node.id ){
                accountsAssignments.push( it );
            }
        });
        data.selected.forEach(( it ) => {
            accountsAssignments.push({
                _id: Random.id(),
                role: { _id: node.id },
                user: { _id: it },
                scope: instance.PR.scope.get()
            });
        });
        instance.PR.accountsAssignments.set( accountsAssignments );
    },

    // in view mode, open the edition dialog
    'click .js-edit'( event, instance ){
        Modal.run({
            accounts: instance.PR.accountsAssignments,
            scope: instance.PR.scope.get(),
            roles: instance.PR.userRoles,
            mdBody: 'pr_scoped_accounts_dialog',
            mdButtons: [ Modal.C.Button.CANCEL, Modal.C.Button.OK ],
            mdClasses: 'modal-lg',
            mdTitle: pwixI18n.label( I18N, 'dialogs.scoped_dialog_title' )
        });
    },

    // open a multiple-select accounts selection
    'click .js-add'( event, instance ){
        const node = instance.PR.selectedNode.get();
        if( node.type === 'R' ){
            let selected = [];
            ( instance.PR.accountsAssignments.get() || [] ).forEach(( it ) => {
                if( it.role._id === node.id ){
                    selected.push( it.user._id );
                }
            });
            instance.PR.accountsSelected.set( selected );
            AccountsHub.runAccountsSelection( instance.PR.accountsSelected, {
                $target: instance.$( '.pr-scoped-accounts-panel' )
            });
        } else {
            console.warn( 'expects a \'R\' node, got '+node.type );
        }
    },

    // remove the currently selected accounts
    //  node.id is the user account identifier to be removed from node.parent
    'click .js-remove'( event, instance ){
        const nodes = instance.PR.selectedArray.get();
        let accountsAssignments = instance.PR.accountsAssignments.get() || [];
        nodes.forEach(( it ) => {
            if( it.type === 'A' ){
                let assignments = [];
                accountsAssignments.forEach(( ac ) => {
                    if( ac._id !== it.id ){
                        assignments.push( ac );
                    }
                });
                accountsAssignments = assignments;
            } else {
                console.warn( 'expects a \'A\' node, got '+it.type );
            }
        });
        instance.PR.accountsAssignments.set( accountsAssignments );
    },

    // handle the selection in the tree
    'pr-rowselect .pr-scoped-accounts-panel'( event, instance, data ){
        instance.PR.selectedNode.set( data.node );
        instance.PR.selectedArray.set( data.selected );
    }
});
