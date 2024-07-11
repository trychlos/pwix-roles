/*
 * pwix:roles/src/client/components/prViewPanel/prViewPanel.js
 *
 * Don't want to use a 'read-only' version of prEdit to not show to the user the roles he/she DOESN'T have...
 * So just show here the roles directly attributed, along with the inherited ones.
 * 
 * If the caller has provided any viewCb object, then display their result in tabs.
 * 
 * Parms:
 * - user: optional, the user identifier or the user full document record, defaulting to current logged-in user
 */

import _ from 'lodash';

import { pwixI18n } from 'meteor/pwix:i18n';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';

import '../pr_tree/pr_tree.js';
import '../view_global_pane/view_global_pane.js';
import '../view_scoped_pane/view_scoped_pane.js';

import './prViewPanel.html';

Template.prViewPanel.onCreated( function(){
    const self = this;

    self.PR = {
        // define constants used both here and in underlying panels
        global_div: 'pr-global',
        global_prefix: 'prglobal_',
        scoped_div: 'pr-scoped',
        scoped_prefix: 'prscoped_',

        // initial roles or initial roles of the specified user as an object { scoped: { <scope>: { all<Array>, direct<Array } }, global: { all<Array>, direct<Array } }
        //  (same structure than current)
        roles: new ReactiveVar({ scoped: {}, global: { all: [], direct: [] }}, _.isEqual ),
        userId: null,
        handle: null
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
        } else {
            self.PR.userId = Meteor.userId();
        }
        if( self.PR.userId ){
            self.PR.handle = self.subscribe( 'pwix_roles_user_assignments', self.PR.userId );
        }
    });

    // when assigned roles subscription is ready, fetch them
    //  take a deep copy to be consistent with the edition panel
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
            Meteor.roleAssignment.find({ 'user._id': self.PR.userId }).fetchAsync().then(( fetched ) => {
                fetched.forEach(( it ) => {
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

    // track the changes in the roles
    self.autorun(() => {
        //console.debug( self.PR.roles.get());
    });
});

Template.prViewPanel.helpers({
    // whether the defined roles hierarchy includes scoped roles ?
    //  when yes, then presents a tabbed panel separating global (non-scoped) roles from scoped ones
    haveScopes(){
        return Roles.scopedRoles().length > 0;
    },

    // parms specific to global (non-scoped) roles view pane
    parmsGlobalPane(){
        const PR = Template.instance().PR;
        return {
            roles: PR.roles,
            pr_div: PR.global_div,
            pr_prefix: PR.global_prefix,
            pr_edit: false
        };
    },

    // parms for the Tabbed component when we have both non-scoped and scoped roles
    parmsTabbed(){
        const PR = Template.instance().PR;
        const tabs = [
            {
                tabid: 'global_tab',
                paneid: 'global_pane',
                navLabel: pwixI18n.label( I18N, 'tabs.global_title' ),
                paneTemplate: 'view_global_pane',
                paneData: {
                    roles: PR.roles,
                    pr_div: PR.global_div,
                    pr_prefix: PR.global_prefix,
                    pr_edit: false
                }
            },
            {
                tabid: 'scoped_tab',
                paneid: 'scoped_pane',
                navLabel: pwixI18n.label( I18N, 'tabs.scoped_title' ),
                paneTemplate: 'view_scoped_pane',
                paneData: {
                    roles: PR.roles,
                    pr_div: PR.scoped_div,
                    pr_prefix: PR.scoped_prefix,
                    pr_edit: false
                }
            }
        ];
        // increment the tabs with the registered ones
        if( Roles._client.viewCbs ){
            Roles._client.viewCbs.forEach(( it ) => {
                const id = Random.id();
                tabs.push({
                    tabId: 'tab-'+id,
                    tabLabel: it.tabLabel,
                    paneId: 'pane-'+id,
                    paneContent: it.paneContent,
                    paneRV: new ReactiveVar( '' )
                });
                if( typeof it.paneContent === 'function' ){
                    it.paneContent( it ).then(( html ) => { it.paneRV.set( html ); });
                }
            });
        }
        return {
            tabs: tabs
        };
    }
});
