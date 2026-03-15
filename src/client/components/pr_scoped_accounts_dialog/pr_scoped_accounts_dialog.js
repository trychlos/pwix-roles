/*
 * pwix:roles/src/client/components/pr_scoped_accounts_dialog/pr_scoped_accounts_dialog.js
 *
 *  This dialog *edits* the scoped roles with the corresponding accounts.
 * 
 *  This is to be run by a TenantManager-role account.
 * 
 * Parms:
 *  - scope: the to-be-edited scope
 *  - roles: a ReactiveVar which contains the roles of the current user
 *  - accounts: a ReactiveVar which contains the accounts per role for the scope
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { pwixI18n } from 'meteor/pwix:i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tolert } from 'meteor/pwix:tolert';

import '../pr_scoped_accounts_panel/pr_scoped_accounts_panel.js';

import './pr_scoped_accounts_dialog.html';

const logger = Logger.get();

Template.pr_scoped_accounts_dialog.onCreated( function(){
    const self = this;

    self.PR = {
        // whether we are running inside of a modal
        isModal: new ReactiveVar( false ),
        // a deep copy of the original at creation time, to be compared at update time and check for non external modifications
        orig_accounts: null,
        // the accounts list to be edited (a deep copy of the original at creation time)
        accounts: new ReactiveVar( null ),
    };

    // setup the item to be edited
    //  we want a clone deep of the provided item, so that we are able to cancel the edition without keeping any sort of data
    self.PR.accounts.set( _.cloneDeep( Template.currentData().accounts.get()));
    self.PR.orig_accounts = _.cloneDeep( Template.currentData().accounts.get());
});

Template.pr_scoped_accounts_dialog.onRendered( function(){
    const self = this;

    // whether we are running inside of a Modal
    self.autorun(() => {
        self.PR.isModal.set( self.$( '.pr-scoped-accounts-dialog' ).parent().hasClass( 'modal-body' ));
    });

    // set the modal target
    self.autorun(() => {
        if( self.PR.isModal.get()){
            Modal.topmost().set({
                target: self.$( '.pr-scoped-accounts-dialog' )
            });
        }
    });
});

Template.pr_scoped_accounts_dialog.helpers({
    // parms for pr_scoped_accounts_panel - edit mode
    parmsPanel(){
        return {
            scope: this.scope,
            roles: this.roles,
            accounts: Template.instance().PR.accounts,
            pr_selectable: true,
            pr_multiple: true,
            editMode: true,
            wantScoped: true,
            withCheckboxes: false
        };
    }
});

Template.pr_scoped_accounts_dialog.events({
    // submit
    //  event triggered in case of a modal
    'md-click .pr-scoped-accounts-dialog'( event, instance, data ){
        if( data.button.id === Modal.C.Button.OK ){
            instance.$( event.currentTarget ).trigger( 'iz-submit' );
        }
    },

    // submit
    // just close
    'iz-submit .pr-scoped-accounts-dialog'( event, instance ){
        const closeFn = function(){
            if( instance.PR.isModal.get()){
                Modal.topmost().close();
            }
        }
        // the tree will be deleted on modal close - inform it of that, thus preventing it to uselessly auto-update
        instance.$( '.pr-tree' ).trigger( 'pr-on-destroy' );
        // update the role assignments
        Meteor.callAsync( 'pwix.Roles.m.resetScopedAssignments', this.scope, instance.PR.accounts.get(), { original: instance.PR.orig_accounts }).then(( res ) => {
            if( res ){
                Tolert.error( pwixI18n.label( I18N, 'accounts.res_error', res ));
            } else  {
                Tolert.success( pwixI18n.label( I18N, 'accounts.res_success' ));
            }
            closeFn();
        })
    }
});

Template.pr_scoped_accounts_dialog.onDestroyed( function(){
    //logger.debug( 'onDestroyed()' );
});
