/*
 * pwix:roles/src/client/js/current.js
 *
 * Roles for the current user are computed as soon as the package becomes ready on the client.
 * But at the time it may be not yet configure()'d.
 * So obtaining the roles hierarchy via the configuration must imply a recomputation of direct roles of the user.
 */

import { Roles as alRoles } from 'meteor/alanning:roles';
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

Roles._client.currentRecompute = function( id ){
    if( Roles._conf.verbosity & Roles.C.Verbose.CURRENT ){
        console.log( 'pwix:roles set roles for current user' );
    }
    const res = ( id ? alRoles.getRolesForUser( id, { anyScope: true }) : [] ) || [];
    _current.val.all = res;
    _current.val.direct = Roles._filter( res );
    const res2 = ( id ? alRoles.getRolesForUser( id, { anyScope: true, fullObjects: true }) : [] ) || [];
    _current.val.globals = Roles._globals( res2 );
    _current.val.scoped = Roles._scoped( res2 );
    _current.val.id = id;
    _current.dep.changed();
};

// update the current user roles when the logged-in status changes
//  client only as Meteor.userId() doesn't has any sense on the server
Tracker.autorun(() => {
    //console.debug( 'ready?', Roles.ready());
    if( Roles.ready()){
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
 *  - all       {Array}     all the roles, either directly or indirectly set
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
    if( Roles._conf.verbosity & Roles.C.Verbose.CURRENT ){
        console.log( 'Roles.current()', Roles.current());
    }
});
