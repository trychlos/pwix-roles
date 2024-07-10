/*
 * pwix:roles/src/client/js/current.js
 *
 * Roles for the current user are computed as soon as the package becomes ready on the client.
 * But at the time it may be not yet configure()'d.
 * So obtaining the roles hierarchy via the configuration must imply a recomputation of direct roles of the user.
 */

import _ from 'lodash';

import { Tracker } from 'meteor/tracker';

// only available on the client
let _current = {
    dep: new Tracker.Dependency(),
    handle: null,
    val: {
        userId: null,
        scoped: {},
        global: {
            all: [],
            direct: []
        }
    },
    currentClear(){
        _current.handle = null;
        _current.val.userId = null;
        _current.val.scoped = {};
        _current.val.global = {
            all: [],
            direct: []
        };
    },
    doSetup( it, o ){
        o.direct.push( it.role._id );
        if( it.inheritedRoles && _.isArray( it.inheritedRoles )){
            it.inheritedRoles.forEach(( role ) => {
                o.all.push( role._id );
            });
        }
    }
};

// re-subscribe when userId changes
Tracker.autorun(() => {
    const userId = Meteor.userId();
    if( userId !== _current.val.userId ){
        _current.currentClear();
        if( userId ){
            _current.handle = Meteor.subscribe( 'pwix_roles_user_assignments', userId );
            _current.val.userId = userId;
        }
    }
});

// track subscription ready
Tracker.autorun(() => {
    //console.debug( 'handle ready', _current.handle.ready());
});

// the current user roles is a reactive data source
//  - reactive to user login/logout
//  - reactive to user roles assignments changes
Tracker.autorun(() => {
    if( Roles.ready() && _current.handle.ready()){
        const userId = Meteor.userId();
        if( userId === _current.val.userId ){
            Meteor.roleAssignment.find({ 'user._id': userId }).fetchAsync().then(( fetched ) => {
                _current.val.scoped = {};
                _current.val.global = { all: [], direct: [] };
                fetched.forEach(( it ) => {
                    if( it.scope ){
                        _current.val.scoped[it.scope] = _current.val.scoped[it.scope] || { all: [], direct: [] };
                        _current.doSetup( it, _current.val.scoped[it.scope] );
                    } else {
                        _current.doSetup( it, _current.val.global );
                    }
                });
                _current.dep.changed();
            });
        }
    }
});

/**
 * A reactive data source.
 * @locus Client
 * @returns {Object} with the roles of the current logged-in user, as an object with keys:
 *  - userId    {String}    the current user identifier
 *  - scoped    {Object}    a per-scope object where each key is a scope, and the value is an object with following keys:
 *      - direct    {Array}     an array of directly (not inherited) assigned scoped roles
 *      - all       {Array}     an array of all allowed scoepd roles (i.e. directly assigned+inherited)
 *  - global    {Object}
 *      - direct    {Array}     an array of directly (not inherited) assigned scoped roles
 *      - all       {Array}     an array of all allowed scoepd roles (i.e. directly assigned+inherited)
 */
Roles.current = function(){
    _current.dep.depend();
    return _current.val;
};

// trace changes
Tracker.autorun(() => {
    _verbose( Roles.C.Verbose.CURRENT, 'pwix:roles current()', Roles.current());
});
