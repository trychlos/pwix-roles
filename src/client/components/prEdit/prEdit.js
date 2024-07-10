/*
 * pwix:roles/src/client/components/prEdit/prEdit.js
 *
 *  Edit the roles of the specified user inside of an autonomous modal dialog.
 * 
 *  Parms:
 *  - `user`: optional, the user identifier or the user full document record
 *      The edition works well without any user, starting from an empty set of roles.
 *      Bu twe will - of course - be unable to save anything.
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
            mdTitle: pwixI18n.label( I18N, 'dialogs.'+( email ? 'edit_title_mail' : 'edit_title' ), email ),
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
        }
        Modal.close();
        return false;
    }
});
