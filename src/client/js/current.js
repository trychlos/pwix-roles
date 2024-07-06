/*
 * pwix:roles/src/client/js/current.js
 *
 * Roles for the current user are computed as soon as the package becomes ready on the client.
 * But at the time it may be not yet configure()'d.
 * So obtaining the roles hierarchy via the configuration must imply a recomputation of direct roles of the user.
 */

import { Tracker } from 'meteor/tracker';

// only available on the client
let _current = {
    dep: new Tracker.Dependency(),
    handle: Meteor.subscribe( 'pwix_roles_current_assignments' ),
    val: {
        userId: null,
        scoped: {},
        global: {
            all: [],
            direct: []
        }
    },
    currentClear(){
        _current.val.scoped = {};
        _current.val.global = {
            all: [],
            direct: []
        };
    },
    async currentRecompute( userId ){
        _verbose( Roles.C.Verbose.CURRENT, 'pwix:roles recomputing current object' );
        const _setup = function( it, o ){
            o.all = o.all || [];
            o.direct = o.direct || [];
            o.direct.push( it.role._id );
            it.inheritedRoles.forEach(( role ) => {
                o.all.push( role._id );
            });
        };
        return Roles.getRolesForUser( userId, { anyScope: true, fullObjects: true }).then(( res ) => {
            let scoped = {};
            let global = {};
            res.forEach(( it ) => {
                if( it.scope ){
                    scoped[it.scope] = scoped[it.scope] || {};
                    _setup( it, scoped[it.scope] );
                } else {
                    _setup( it, global );
                }
            });
            _current.val.scoped = scoped;
            _current.val.global = global;
        });
    }
};

// the current user roles is a reactive data source
//  - reactive to user login/logout
//  - reactive to user roles assignments changes
Tracker.autorun(() => {
    //console.debug( 'ready?', Roles.ready());
    if( Roles.ready() && _current.handle.ready()){
        const userId = Meteor.userId();
        if( userId !== _current.val.userId ){
            _verbose( Roles.C.Verbose.CURRENT, 'pwix:roles userId changes to', userId );
            if( userId ){
                _current.currentRecompute( userId ).then(() => {
                    _current.val.userId = userId;
                    _current.dep.changed();
                });
            } else {
                _current.currentClear();
                _current.val.userId = null;
                _current.dep.changed();
            }
        }
    }
});

/**
 * A reactive data source.
 * @locus Client
 * @returns {Object} with the roles of the current logged-in user, as an object with keys:
 *  - id        {String}    the current user identifier
 *  - all       {Array}     all the assigned roles, either directly or indirectly set
 *  - direct    {Array}     only the directly attributed top roles in the hierarchy (after having removed indirect ones)
 *  - scoped    {Object}
 *      > '<scope>':        the list of roles which hold this scope
 *  - globals   {Array}     the list of non-scoped roles
 */
Roles.current = function(){
    _current.dep.depend();
    return _current.val;
};

// trace changes
Tracker.autorun(() => {
    _verbose( Roles.C.Verbose.CURRENT, 'pwix:roles current()', Roles.current());
});
