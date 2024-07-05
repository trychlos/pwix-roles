/*
 * /imports/client/components/roles_edit/roles_edit.js
 *
 *  Edit the roles of the specified user.
 * 
 *  Parms:
 *  - id: optional, the user identifier
 *  - user: optional, the user full record
 *  - roles: optional, a reactive var which is expected to contain the list of attributed roles
 * 
 *  Order of precedence is:
 *  1. id
 *  2. user
 *  3. roles
 *      If 'id' is specified, this is enough and the component takes care of read the attributed roles of the identified user.
 *      Else, if user is identified, then the component takes care of read the attributed roles of the user.
 *      Else, if roles are specified, then they are edited, and updated in this var.
 * 
 *  As a side effect, if an information is given about the user (id or user itself), then the mail address is displayed
 *  in the dialog title.
 */

import { pwixI18n } from 'meteor/pwix:i18n';
import { Modal } from 'meteor/pwix:modal';
import { ReactiveVar } from 'meteor/reactive-var';

import '../prEditPanel/prEditPanel.js';

import './prEdit.html';

Template.prEdit.onCreated( function(){
    const self = this;

    self.PR = {
        // input parms
        user: new ReactiveVar( null )
    };

    // get user informations if possible
    // if 'id' is specified, then get the user record
    self.autorun(() => {
        if( Template.currentData().id ){
            Meteor.call( 'Roles.Accounts.User', Template.currentData().id, ( err, res ) => {
                if( err ){
                    console.error( err );
                } else {
                    self.PR.user.set( res );
                }
            });
        }
    });

    // get user informations if possible
    // if a 'user' is specified, fine
    self.autorun(() => {
        if( Template.currentData().user ){
            self.PR.user.set( Template.currentData().user );
        }
    });

    // creates the modal
    self.autorun(() => {
        const user = self.PR.user.get();
        const email = user ? user.emails[0].address : null;
        Modal.run({
            mdBody: 'prEdit_body',
            mdFooter: 'prEdit_footer',
            mdTitle: pwixI18n.label( I18N, 'dialogs.'+( email ? 'title_mail' : 'title' ), email ),
            user: user,
            ...Template.currentData()
        });
    });
});

Template.prEdit_footer.helpers({
    // i18n namespace
    i18n( opts ){
        return pwixI18n.label( I18N, opts.hash.key );
    }
});

Template.prEdit_footer.events({
    // save the updates
    'click .pr-submit'( event, instance ){
        const filtered = Roles.EditPanel.checked( instance.$( '.pr-tree' ));
        // update the user roles if a user was provided
        const user = instance.PR.user.get();
        if( user ){
            Meteor.callAsync( 'Roles.setUsersRoles', user._id, filtered );
            Meteor.callAsync( 'Roles.Accounts.Updated', user._id );
        }
        Modal.close();
        return false;
    }
});
