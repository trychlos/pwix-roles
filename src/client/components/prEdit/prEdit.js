/*
 * /imports/client/components/roles_edit/roles_edit.js
 *
 *  Edit the roles of the specified user.
 * 
 *  Parms:
 *  - `user`: optional, the user identifier or the user full document record
 * 
 *  As a side effect, if a user is provided as a full document, then the mail address is displayed in the dialog title.
 */

import { pwixI18n } from 'meteor/pwix:i18n';
import { Modal } from 'meteor/pwix:modal';

import '../prEditPanel/prEditPanel.js';

import './prEdit.html';

Template.prEdit.onCreated( function(){
    const self = this;

    // creates the modal
    self.autorun(() => {
        const user = Temmplate.currentData().user;
        const email = user && user.emails ? user.emails[0].address : null;
        Modal.run({
            mdBody: 'prEdit_body',
            mdFooter: 'prEdit_footer',
            mdTitle: pwixI18n.label( I18N, 'dialogs.'+( email ? 'title_mail' : 'title' ), email ),
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
        const roles = Roles.EditPanel.roles();
        // update the user roles if a user was provided
        if( this.user ){
            Meteor.callAsync( 'Roles.setUserRoles', user, roles );
            Meteor.callAsync( 'Roles.Accounts.Updated', user );
        }
        Modal.close();
        return false;
    }
});
