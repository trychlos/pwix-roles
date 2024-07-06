/*
 * pwix:roles/src/client/js/current.js
 *
 * Roles for the current user are computed as soon as the package becomes ready on the client.
 * But at the time it may be not yet configure()'d.
 * So obtaining the roles hierarchy via the configuration must imply a recomputation of direct roles of the user.
 */

import { Tracker } from 'meteor/tracker';

// only available on the client
_current = {
    dep: new Tracker.Dependency(),
    val: {
        id: '',
        all: [],
        direct: [],
        scoped: {},
        globals: []
    }
};

Roles._client.currentRecompute = async function( id ){
    _verbose( Roles.C.Verbose.CURRENT, 'pwix:roles recomputing roles for current user' );
    let promises = [];
    if( id ){
        promises.push( Roles.getRolesForUser( id, { anyScope: true, fullObjects: true }).then(( res ) => {
            let all = [];
            let direct = [];
            let scoped = {};
            let globals = [];
            res.forEach(( it ) => {
                it.inheritedRoles.forEach(( role ) => {
                    all.push( role._id );
                });
                direct.push( it.role._id );
                if( it.scope ){
                    scoped[it.scope] = scoped[it.scope] || [];
                    scoped[it.scope].push( it.role._id );
                } else {
                    globals.push( it.role._id );
                }
            });
            _current.val.all = all;
            _current.val.direct = direct;
            _current.val.scoped = scoped;
            _current.val.globals = globals;
        }));
    } else {
        _current.val.all = [];
        _current.val.direct = [];
        _current.val.scoped = {};
        _current.val.globals = [];
    }
    Promise.allSettled( promises ).then(() => {
        _current.val.id = id;
        _current.dep.changed();
    });
};

// the current user roles is a reactive data source
//  - reactive to user login/logout
//  - reactive to roles configuration
Tracker.autorun(() => {
    //console.debug( 'ready?', Roles.ready());
    if( Roles.ready()){
        const conf = Roles.configure();
        const id = Meteor.userId();
        if( _current.val.id !== id ){
            Roles._client.currentRecompute( id );
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
    _verbose( Roles.C.Verbose.CURRENT, 'Roles.current()', Roles.current());
});
