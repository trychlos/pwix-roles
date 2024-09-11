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

import { PlusButton } from 'meteor/pwix:plus-button';
import { ReactiveVar } from 'meteor/reactive-var';

import '../edit_global_pane/edit_global_pane.js';
import '../edit_scoped_pane/edit_scoped_pane.js';
import '../edit_scoped_plus/edit_scoped_plus.js';
import '../pr_tree/pr_tree.js';

import './prEditPanel.html';

Template.prEditPanel.onCreated( function(){
    const self = this;

    self.PR = {
        // define constants used both here and in underlying panels
        global_div: 'pr-global',
        global_prefix: 'prglobal_',
        scoped_div: 'pr-scoped',
        scoped_prefix: 'prscoped_',
        scoped_none: 'NONE',

        // whether the plus button is enabled
        enabledPlus: new ReactiveVar( true ),

        // initial roles or initial roles of the specified user as an object { scoped: { <scope>: { all<Array>, direct<Array } }, global: { all<Array>, direct<Array } }
        //  (same structure than current)
        roles: new ReactiveVar({ scoped: {}, global: { all: [], direct: [] }}),
        userId: null,
        handle: null,

        // have to name the Tabbed component to be able to save/restore the last active pane
        tabbedName: 'pwix:roles/pr-edit-panel',
    };

    // when this component is created, then declare the function to get back its values
    Roles.EditPanel = {
        /**
         * @returns {Array} the list of global roles checked in the prEditPanel
         */
        global(){
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
            //console.debug( 'roles', roles );
            return roles;
        },
        /**
         * @returns {Object} where keys are the scopes, and values an array of direct roles
         *  NB: this doesn't return the checked roles for a new 'NONE' scope
         * so have to filter before returning the data
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

    // if a user is specified, then subscribe to its assigned roles
    self.autorun(() => {
        const user = Template.currentData().user;
        self.PR.userId = null;
        if( user ){
            if( _.isObject( user )){
                self.PR.userId = user._id;
            }
            if( _.isString( user )){
                self.PR.userId = user;
            }
        }
        if( self.PR.userId ){
            self.PR.handle = self.subscribe( 'pwix_roles_user_assignments', self.PR.userId );
        }
    });

    // when assigned roles subscription is ready, fetch them
    //  take a deep copy as this will be the edition starting point
    self.autorun(() => {
        if( self.PR.handle && self.PR.handle.ready()){
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
                self.PR.roles.set( _.cloneDeep( roles ));
            });
        }
    });

    // track edited roles
    self.autorun(() => {
        //console.debug( 'edited roles', self.PR.roles.get());
        //console.debug( 'edited roles global', self.PR.roles.get().global.direct );
        //console.debug( 'edited roles scoped', self.PR.roles.get().scoped );
    });

    // disable the 'plus' button while we have an unset scope or no available scope at all
    self.autorun(() => {
        const scoped = self.PR.roles.get().scoped;
        const haveNone = Object.keys( scoped ).includes( self.PR.scoped_none ) > 0;
        const haveScopes = Object.keys( Roles._scopes.labels.all()).length > 0;
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
                    paneTemplate: 'edit_global_pane',
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
                    paneTemplate: 'edit_scoped_pane',
                    paneData: {
                        roles: PR.roles,
                        pr_div: PR.scoped_div,
                        pr_prefix: PR.scoped_prefix,
                        pr_none: PR.scoped_none
                    }
                },
                {
                    name: 'roles_plus_tab',
                    navTemplate: 'edit_scoped_plus',
                    navData: {
                        enabled: Template.instance().PR.enabledPlus,
                        label: pwixI18n.label( I18N, 'panels.add_button' ),
                        shape: PlusButton.C.Shape.RECTANGLE,
                        title: pwixI18n.label( I18N, 'panels.add_title' ),
                    }
                }
            ]
        };
    }
});

Template.prEditPanel.events({
    // because of the position of the plusButton in the DOM, the edit_scoped_pane component cannot directly handle the clicks
    //  we have to get them here, and redirect to the pane
    'click .js-plus'( event, instance ){
        if( instance.PR.enabledPlus.get()){
            instance.$( '.pr-edit-scoped-pane' ).trigger( 'pr-new-scope' );
        }
    },

    // show/hide the 'new scope' button depending of the shown pane
    // note that initial display only triggers the 'shown' event
    'tabbed-pane-shown .prEditPanel'( event, instance, data ){
        if( data.tab.tabid === 'scoped_tab' ){
            instance.$( '.pr-edit-scoped-plus' ).removeClass( 'ui-hidden' );
        } else {
            instance.$( '.pr-edit-scoped-plus' ).addClass( 'ui-hidden' );
        }
    }
});
