/*
 * pwix:roles/src/client/js/accounts-ui.js
 *
 * If pwix:accounts-ui package is installed, and unless this package has been configured against it, install a 'My roles' option in the menu items
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { pwixI18n } from 'meteor/pwix:i18n';
import { Tracker } from 'meteor/tracker';

const logger = Logger.get();

Meteor.startup(() => {
    Tracker.autorun(( comp ) => {
        // set a hook on dropdown menu items
        // when logged-in install a 'My roles' item
        if( Package['pwix:accounts-ui'] && Package['pwix:accounts-ui'].AccountsUI.ready() && Roles.configure().withAccountsUIDropdownItem ){
            const AccountsUI = Package['pwix:accounts-ui'].AccountsUI;
            // whether the dropdown menu items already have a divider
            const _hasDivider = function( items ){
                for( const it of items ){
                    if( it.match( 'dropdown-divider' )){
                        return true;
                    }
                }
                return false;
            };
            // install the menu item
            AccountsUI.onRebuildMenuItems( async ( items, opts ) => {
                const connection = AccountsUI.Connection;
                switch( connection.state()){
                    case AccountsUI.C.Connection.LOGGED:
                        if( !_hasDivider( items )){
                            items.push( '<hr class="dropdown-divider">' );
                        }
                        items.push( '<a class="dropdown-item d-flex align-items-center justify-content-start ac-dropdown-item" href="#" data-ac-event="roles-my-roles">'
                                        +'<span class="fa-solid fa-fw fa-user-shield"></span>'
                                        +'<p>'
                                        +pwixI18n.label( I18N, 'menu.my_roles' )
                                        +'</p></a>'
                        );
                        break;
                }
                return items;
            });
            // display the roles of the currently connected user
            const _displayRoles = function( AC ){
                Blaze.renderWithData( Template.prView, {}, $( 'body' )[0] );
            };
            // install the event handler
            $( document ).on( 'roles-my-roles', '.acUserLogin', function( event, data ){
                _displayRoles( data.AC );
            });
            // only install that once
            comp.stop();
        }
    });
});
