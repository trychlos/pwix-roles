/*
 * pwix:roles/src/client/components/prEditPanel/prEditPanel.js
 *
 *  Edit the roles of the specified user.
 * 
 *  Parms:
 *  - `user`: optional, the user identifier or the user full document record
 *
 *  If the user is not specified, then the edition begins with an empty set of roles.
 */

import _ from 'lodash';

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';
import { PlusButton } from 'meteor/pwix:plus-button';
import { ReactiveVar } from 'meteor/reactive-var';

import '../pr_edit_global_pane/pr_edit_global_pane.js';
import '../pr_edit_scoped_pane/pr_edit_scoped_pane.js';
import '../pr_edit_scoped_plus/pr_edit_scoped_plus.js';
import '../pr_tree/pr_tree.js';

import './prEditPanel.html';

const logger = Logger.get();

Template.prEditPanel.onCreated( function(){
    const self = this;

    self.PR = {
        // define constants used both here and in underlying panels
        global_div: 'pr-global',
        global_prefix: 'prglobal_',
        scoped_div: 'pr-scoped',
        scoped_prefix: 'prscoped_',
        scoped_none: 'NONE',
        userId: new ReactiveVar( null ),
        handle: null,

        // whether the plus button is enabled
        enabledPlus: new ReactiveVar( true ),

        // initial roles of the specified user as an object { scoped: { <scope>: { all<Array>, direct<Array } }, global: { all<Array>, direct<Array } }
        //  (same structure than current)
        roles: new ReactiveVar({ scoped: {}, global: { all: [], direct: [] }}),

        // have to name the Tabbed component to be able to save/restore the last active pane
        tabbedName: 'pwix:roles/pr-edit-panel',
    };

    // when this component is created, then declare the function to get back its values
    Roles.EditPanel = {
        /**
         * @returns {Array} the list of global roles checked in the prEditPanel
         */
        global(){
            //logger.debug( 'self.PR.roles.get()',self.PR.roles.get());
            return self.PR.roles.get().global.direct;
        },

        /**
         * @returns {Object} an object with following keys:
         *  - scoped        {Object}    a per-scope object where each key is a scope, and the value is an object with following keys:
         *      - direct    {Array}     an array of directly (not inherited) assigned scoped roles
         *  - global        {Object}
         *      - direct    {Array}     an array of directly (not inherited) assigned scoped roles
         */
        roles(){
            let roles = {
                global: {
                    direct: Roles.EditPanel.global()
                },
                scoped: {}
            };
            const scoped = Roles.EditPanel.scoped();
            Object.keys( scoped ).forEach(( scope ) => {
                roles.scoped[scope] = {
                    direct: scoped[scope]
                };
            });
            //logger.debug( 'roles', roles );
            return roles;
        },

        /**
         * @returns {Object} where keys are the scopes, and values an array of direct roles
         *  NB: doesn't want return the checked roles for a new 'NONE' scope
         *  so have to filter before returning the data
         */
        scoped(){
            let directScoped = {};
            const rolesScoped = self.PR.roles.get().scoped;
            Object.keys( rolesScoped ).forEach(( scope ) => {
                if( scope !== self.PR.scoped_none ){
                    directScoped[scope] = rolesScoped[scope].direct;
                }
            });
           return directScoped;
        }
    };

    // get user identifier
    self.autorun(() => {
        const user = Template.currentData().user;
        self.PR.userId.set( user ? ( _.isString( user ) ? user : user._id ) : null );
    });

    // subscribe to the roles of the user
    self.autorun(() => {
        if( !self.PR.handle ){
            self.PR.handle = self.subscribe( 'pwix.Roles.p.userAssignments', self.PR.userId.get());
        }
    });

    // build the expected data structure
    self.autorun(() => {
        if( self.PR.handle && self.PR.handle.ready()){
            const collectionName = Roles.configure().assignmentsCollection;
            const collection = Mongo.getCollection( collectionName );
            check( collection, Mongo.Collection );
            collection.find({ 'user._id': self.PR.userId.get() }).fetchAsync().then(( fetched ) => {
                let roles = { global: { direct: [], all: [] }, scoped: {}};
                for( const it of fetched ){
                    if( it.scope ){
                        roles.scoped[it.scope] = roles.scoped[it.scope] || { all: [], direct: [] };
                        Roles._doSetup( it, roles.scoped[it.scope] );
                    } else {
                        Roles._doSetup( it, roles.global );
                    }
                }
                //logger.debug( 'fetched and built', roles );
                self.PR.roles.set( roles );
            });
        }
    });

    // track edited roles
    self.autorun(() => {
        //logger.debug( 'edited roles', self.PR.roles.get());
        //logger.debug( 'edited roles global', self.PR.roles.get().global.direct );
        //logger.debug( 'edited roles scoped', self.PR.roles.get().scoped );
    });

    // disable the 'plus' button while we have an unset scope or no available scope at all
    self.autorun(() => {
        const scoped = self.PR.roles.get().scoped;
        const haveNone = Object.keys( scoped ).includes( self.PR.scoped_none ) > 0;
        const haveScopes = Object.keys( Roles.scopes.labels.all()).length > 0;
        self.PR.enabledPlus.set( !haveNone && haveScopes );
    });
});

Template.prEditPanel.helpers({
    // whether the defined roles hierarchy includes scoped roles ?
    //  when yes, then presents a tabbed panel separating global (non-scoped) roles from scoped ones
    haveScopes(){
        return Roles.scopedRoles().length > 0;
    },

    // parms specific to global (non-scoped) roles edition pane
    parmsGlobalPane(){
        const PR = Template.instance().PR;
        return {
            roles: PR.roles,
            pr_div: PR.global_div,
            pr_prefix: PR.global_prefix
        };
    },

    // parms for the Tabbed component when we have both non-scoped and scoped roles
    parmsTabbed(){
        const PR = Template.instance().PR;
        return {
            name: PR.tabbedName,
            tabs: [
                {
                    name: 'roles_global_tab',
                    navLabel: pwixI18n.label( I18N, 'tabs.global_title' ),
                    paneTemplate: 'pr_edit_global_pane',
                    paneData: {
                        roles: PR.roles,
                        pr_div: PR.global_div,
                        pr_prefix: PR.global_prefix
                    }
                },
                {
                    name: 'roles_scoped_tab',
                    navLabel: pwixI18n.label( I18N, 'tabs.scoped_title' ),
                    navItemClasses: 'flex-grow-1',
                    paneTemplate: 'pr_edit_scoped_pane',
                    paneData: {
                        roles: PR.roles,
                        pr_div: PR.scoped_div,
                        pr_prefix: PR.scoped_prefix,
                        pr_none: PR.scoped_none
                    }
                },
                {
                    name: 'roles_plus_tab',
                    navTemplate: 'pr_edit_scoped_plus',
                    navData: {
                        enabled: Template.instance().PR.enabledPlus,
                        label: pwixI18n.label( I18N, 'panels.add_button' ),
                        shape: PlusButton.C.Shape.RECTANGLE,
                        title: pwixI18n.label( I18N, 'panels.add_title' ),
                        classes: 'btn btn-sm btn-outline-primary'
                    }
                }
            ]
        };
    }
});

Template.prEditPanel.events({
    // because of the position of the PlusButton in the DOM, the pr_edit_scoped_pane component cannot directly handle the clicks
    //  we have to get them here, and redirect to the pane
    'click .js-plus'( event, instance ){
        if( instance.PR.enabledPlus.get()){
            instance.$( '.pr-edit-scoped-pane' ).trigger( 'pr-new-scope' );
        }
    },

    // show/hide the 'new scope' button depending of the shown pane
    // note that initial display only triggers the 'shown' event
    'tabbed-pane-shown .prEditPanel'( event, instance, data ){
        if( data.tab.name === 'roles_scoped_tab' ){
            instance.$( '.pr-edit-scoped-plus' ).removeClass( 'ui-hidden' );
        } else {
            instance.$( '.pr-edit-scoped-plus' ).addClass( 'ui-hidden' );
        }
    }
});

Template.prEditPanel.onDestroyed( function(){
    delete Roles.EditPanel;
});
