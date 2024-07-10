/*
 * pwix:roles/src/client/components/prView/prView.js
 *
 *  View the roles of the specified user inside of an autonomous modal dialog.
 * 
 *  Parms:
 *  - title: (opt) a ReactiveVar which contains the modal title, defaulting to 'My roles'
 *  - user: optional, the user identifier or the user full document record, defaulting to current logged-in user.
 * 
 *  As a side effect, if a user is provided as a full document, then the mail address is displayed in the dialog title.
 */

import { pwixI18n } from 'meteor/pwix:i18n';
import { Modal } from 'meteor/pwix:modal';

import '../prViewPanel/prViewPanel.js';

import './prView.html';

Template.prView.onCreated( function(){
    const self = this;

    self.PR = {
        // modal title (expected to be a ReactiveVar if provided)
        title: null
    };

    // creates the modal
    self.autorun(() => {
        const user = Template.currentData().user;
        const email = user && user.emails ? user.emails[0].address : null;
        Modal.run({
            mdBody: 'prView_body',
            mdFooter: 'prView_footer',
            mdTitle: pwixI18n.label( I18N, 'dialogs.'+( email ? 'view_title_mail' : 'view_title' ), email ),
            ...Template.currentData()
        });
    });

    // get the title
    self.autorun(() => {
        const title = Template.currentData().title;
        if( title ){
            if( title instanceof ReactiveVar ){
                self.PR.title = title;
            } else {
                console.warn( 'expect title be a ReactiveVar, found', title );
            }
        }
    });
});

Template.prView.onRendered( function(){
    const self = this;

    let title = pwixI18n.label( I18N, 'dialogs.myroles' );

    self.autorun(() => {
        if( self.PR.title ){
            title = self.PR.title.get();
        }
        Modal.set({ title: title });
    });
});

Template.prView_footer.helpers({
    // i18n namespace
    i18n( opts ){
        return pwixI18n.label( I18N, opts.hash.key );
    }
});
