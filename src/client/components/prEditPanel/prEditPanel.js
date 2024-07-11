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

import { ReactiveVar } from 'meteor/reactive-var';

import '../edit_global_pane/edit_global_pane.js';
import '../edit_scoped_pane/edit_scoped_pane.js';
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

        // initial roles or initial roles of the specified user as an object { scoped: { <scope>: { all<Array>, direct<Array } }, global: { all<Array>, direct<Array } }
        //  (same structure than current)
        roles: new ReactiveVar({ scoped: {}, global: { all: [], direct: [] }}, _.isEqual ),
        userId: null,
        handle: null
    };

    // when this component is created, then declare the function to get back its values
    Roles.EditPanel = {
        /**
         * @returns {Array} the list of global roles checked in the prEditPanel
         */
        global(){
            let checked = [];
            self.$( '.'+self.PR.global_div ).jstree( true ).get_checked_descendants( '#' ).every(( id ) => {
                checked.push( id.replace( self.PR.global_prefix, '' ));
                return true;
            });
            const filtered = Roles._filter( checked );
            return filtered;
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
                if( scope && scope !== self.PR.scoped_none ){
                    roles.scoped[scope] = {
                        direct: scoped[scope]
                    };
                }
            });
            //console.debug( 'roles', roles );
            return roles;
        },
        /**
         * @returns {Object} where keys are the scopes, and values an array of direct roles
         *  NB: this also returns the checked roles for a new 'NONE' scope
         *  this is needed for UI management, but you have to take care of not assigning this pseudo-scope to the user.
         */
        scoped(){
            let checked = {};
            self.$( '.scoped-item' ).each( function(){
                const scope = $( this ).find( '.js-scope :selected' ).val();
                let locals = [];
                $( this ).find( '.'+self.PR.scoped_div ).jstree( true ).get_checked_descendants( '#' ).every(( id ) => {
                    locals.push( id.replace( self.PR.scoped_prefix, '' ));
                    return true;
                });
                checked[scope] = Roles._filter( locals );
            });
            //console.debug( 'scoped()', checked );
            return checked;
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
                it.inheritedRoles.forEach(( role ) => {
                    o.all.push( role._id );
                });
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
            tabs: [
                {
                    tabid: 'global_tab',
                    paneid: 'global_pane',
                    navLabel: pwixI18n.label( I18N, 'tabs.global_title' ),
                    paneTemplate: 'edit_global_pane',
                    paneData: {
                        roles: PR.roles,
                        pr_div: PR.global_div,
                        pr_prefix: PR.global_prefix
                    }
                },
                {
                    tabid: 'scoped_tab',
                    paneid: 'scoped_pane',
                    navLabel: pwixI18n.label( I18N, 'tabs.scoped_title' ),
                    paneTemplate: 'edit_scoped_pane',
                    paneData: {
                        roles: PR.roles,
                        pr_div: PR.scoped_div,
                        pr_prefix: PR.scoped_prefix,
                        pr_none: PR.scoped_none
                    }
                }
            ]
        };
    }
});
