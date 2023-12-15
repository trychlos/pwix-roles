/*
 * pwix:roles/src/common/js/functions.js
 */

import _ from 'lodash';

import { Roles as alRoles } from 'meteor/alanning:roles';
import { Tracker } from 'meteor/tracker';

/*
 * Enumerate the configured role hierarchy, calling the provided callback for each and every role.
 *  Enumeration may be stopped by the callback returning false.
 */
Roles._enumerate = function( cb, args=null ){
    const _enum = function( rolesArray ){
        rolesArray.every(( role ) => {
            const ret = cb( role, args );
            const cont = _.isBoolean( ret ) ? ret : true;
            if( cont !== false ){
                if( role.children ){
                    _enum( role.children );
                }
            }
            return cont;
        });
    }
    _enum( Roles._conf.roles.hierarchy || [] );
}

/*
 * Filter the provided array to remove inherited roles
 * @param {Array} array
 * @returns {Array}
 */
Roles._filter = function( array ){
    //console.debug( 'filter in', array );
    let filtered = [];
    function f_filter( role ){
        if( !filtered.includes( role )){
            let hasParent = false;
            filtered.every(( f ) => {
                if( Roles.isParent( f, role )){
                    hasParent = true;
                    return false;
                }
                return true;
            });
            if( !hasParent ){
                filtered.push( role );
            }
        }
    }
    const sorted = Roles._sort( array );
    sorted.every(( role ) => {
        f_filter( role );
        return true;
    });
    //console.debug( 'filter out', filtered );
    //if( filtered.length === 0 && array.length > 0 ){
    //    throw new Error( 'error' );
    //}
    return filtered;
};

/*
 * Extract from the provided array the global roles
 * NB; in alanning:roles, when a role is scoped, all inherited roles are also scoped
 * @param {Array} array
 * @returns {Array}
 */
Roles._globals = function( array ){
    let globals = [];
    array.every(( o ) => {
        if( _.isNil( o.scope )){
            o.inheritedRoles.every(( r ) => {
                globals.push( r._id );
                return true;
            });
        }
        return true;
    });
    return globals;
};

/*
 * Extract from the provided array the roles configured as scoped
 * NB; in alanning:roles, when a role is scoped, all inherited roles are also scoped
 * @param {Array} array
 * @returns {Objec} roles by scope
 */
Roles._scoped = function( array ){
    let scoped = {};
    array.every(( o ) => {
        if( _.isString( o.scope )){
            let roles = [];
            o.inheritedRoles.every(( r ) => {
                roles.push( r._id );
                return true;
            });
            scoped[o.scope] = roles;
        }
        return true;
    });
    return scoped;
};

/*
 * Sort the provided array in the hierarchy order
 * @param {Array} array
 * @returns {Array}
 */
Roles._sort = function( array ){
    let sorted = [];
    function f_sort( o ){
        // if the role is included in the input array, then all chilren are inherited
        //console.debug( o );
        if( array.includes( o.name )){
            sorted.push( o.name );
        } else if( o.children ){
            o.children.every(( child ) => {
                f_sort( child );
                return true;
            });
        }
    }
    const h = Roles._conf && Roles._conf.roles && Roles._conf.roles.hierarchy ? Roles._conf.roles.hierarchy : [];
    //console.debug( h );
    h.every(( o ) => {
        f_sort( o );
        return true;
    });
    //console.debug( 'sorted', sorted );
    return sorted;
};

/**
 * @summary Add roles to the users
 * @locus Anywhere
 * @param {Array|Object|String} users 
 * @param {Array|String} roles
 * @param {Object} options
 * @returns {Array} array of roles directly attributed to the user (i.e. having removed the inherited ones)
 */
Roles.addUsersToRoles = function( users, roles, options={} ){
    return Meteor.isClient ? Meteor.callPromise( 'Roles.addUsersToRoles', users, roles, options ) : alRoles.addUsersToRoles( users, roles, options );
}

/**
 * @summary Returns the direct roles of the user
 * @locus Anywhere
 * @param {Object|String} user User identifier or actual user object
 * @param {Object} options
 * @returns {Array} array of roles directly attributed to the user (i.e. having removed the inherited ones)
 */
Roles.directRolesForUser = function( user, options={} ){
    return Roles._filter( alRoles.getRolesForUser( user, options ));
}

/**
 * @locus Anywhere
 * @returns {Object} the configured roles hierarchy flattened as a hash of objects name -> { name, children, scoped }
 */
Roles.flat = function(){
    let full = {};
    function f_explore( o ){
        // add the name to the full object if not already here
        if( !Object.keys( full ).includes( o.name )){
            full[o.name] = o;
        }
        // same for children
        if( o.children ){
            o.children.every(( child ) => {
                f_explore( child );
                return true;
            });
        }
    }
    const h = Roles._conf && Roles._conf.roles && Roles._conf.roles.hierarchy ? Roles._conf.roles.hierarchy : [];
    h.every(( o ) => {
        f_explore( o );
        return true;
    });
    //console.debug( h, full );
    return full;
}

/**
 * @locus Anywhere
 * @param {Object|String} user a user document or a user identifier
 * @param {Object} options
 * @returns {Promise} on client side, a Promise which resolves to the array result
 * @returns {Array} on server side, an array of roles documents
 */
Roles.getRolesForUser = function( user, options={} ){
    return Meteor.isClient ? Meteor.callPromise( 'Roles.getRolesForUser', user, options ) : Meteor.server.getRolesForUser( user, options );
}

/**
 * @locus Anywhere
 * @param {String} scope the scope identifier
 * @returns {Promise} on client side, a Promise which resolves to the array result
 * @returns {Array} on server side, an array of user identifiers which have a role in this scope
 */
Roles.getUsersInScope = function( scope ){
    if( Meteor.isClient ){
        return Meteor.callPromise( 'Roles.getUsersInScope', scope );
    }
    // server-side
    return Roles.server.getUsersInScope( scope );
}

/**
 * @param {Array|Object|String} users an array of objects, or an object, or an array of strings, or a string identifier
 * @returns {Array} an array of string identifiers
 */
Roles.idsFromUsers = function( users ){
    let ids = [];
    if( typeof users === 'string' ){
        ids.push( users );
    } else if( Array.isArray( users )){
        users.every(( u ) => {
            if( typeof u === 'string' ){
                ids.push( u );
            } else if( u._id ){
                ids.push( u._id );
            } else {
                console.error( 'expected an _id, not found', u );
            }
            return true;
        });
    } else if( users._id ){
        ids.push( users._id );
    } else {
        console.error( 'expected an _id, not found', users );
    }
    return ids;
}

/**
 * @param {String} a
 * @param {String} b
 * @returns {Boolean} true if a is parent of b
 */
Roles.isParent = function( a, b ){
    return Roles.parents( b ).includes( a );
}

/**
 * @param {String} role
 * @returns {Boolean} true if the role is configured as scoped
 */
Roles.isRoleScoped = function( role ){
    let scoped = false;
    Roles._enumerate(( r ) => {
        let cont = true;
        if( r.name === role ){
            cont = false;
            scoped = r.scoped === true;
        }
        return cont;
    });
    return scoped;
}

/**
 * Build an array which contains the ordered list of the parent(s) of the specified role
 * @param {String} role 
 * @returns {Array} the ordered parents, not including the given role
 */
Roles.parents = function( role ){
    let parents = [];
    function f_search( o ){
        if( o.name === role ){
            return false;
        }
        let found = false;
        if( o.children ){
            parents.push( o.name );
            o.children.every(( child ) => {
                found = !f_search( child );
                if( !found ){
                    parents.pop( o.name );
                }
                return !found;
            });
        }
        return !found;
    }
    Roles._conf.roles.hierarchy.every(( o ) => {
        parents = [];
        return f_search( o );
    });
    //console.log( 'Roles.parents of', role, 'are', parents );
    return parents;
}

/**
 * @param {Object} user a user identifier or a user object
 */
Roles.removeAllRolesFromUser = function( user ){
    return Meteor.isClient ? Meteor.callPromise( 'Roles.removeAllRolesFromUser', user ) : Roles.server.removeAllRolesFromUser( user );
}

/**
 * @param {Array|String} roles a role or an array of roles
 * @param {Object} opts an option object with following keys:
 *  - scope: the relevant scope, all scopes if not set
 */
Roles.removeUserAssignmentsForRoles = function( roles, opts ){
    return Meteor.isClient ? Meteor.callPromise( 'Roles.removeUserAssignmentsForRoles', roles, opts ) : Roles.server.removeUserAssignmentsForRoles( roles, opts );
}

/**
 * @param {Array} roles a list of roles
 * @returns {Array} a deep copy of the original roles hierarchy in which only the input roles are kept
 */
Roles.userHierarchy = function( roles ){
    let filtered = [];
    function f_filter( o ){
        // if we have the hierarchy object, we also have all its children
        if( roles.includes( o.name )){
            filtered.push( o );
        } else if( o.children ){
            o.children.every(( child ) => {
                f_filter( child );
                return true;
            });
        }
    }
    const h = Roles._conf && Roles._conf.roles && Roles._conf.roles.hierarchy ? Roles._conf.roles.hierarchy : [];
    h.every(( o ) => {
        f_filter( o );
        return true;
    });
    return filtered
}

/**
 * Check if user has specified roles.
 * A reactive data source.
 * @locus Anywhere
 * @param {Object|String} user User identifier or actual user object
 * @param {Array|String} roles required roles as a string or an array of strings
 * @param {Object} options
 * @returns {Boolean} true if the user exhibits any of the required roles
 */
_userIsInRoles = {
    dep: null,
    userId: null,
    userRoles: [],
    reqRoles: []
};
Roles.userIsInRoles = function( user, roles, options={} ){
    if( !_userIsInRoles.dep ){
        _userIsInRoles.dep = new Tracker.Dependency();
        _userIsInRoles.dep.depend();
    }
    //console.log( 'Roles.userIsInRoles', user, roles );

    // keep a trace of previous values to advertise of change
    const prevId = _userIsInRoles.userId;
    const prevRoles = [ ..._userIsInRoles.userRoles ];
    const prevReq = [ ..._userIsInRoles.reqRoles ];

    // set new values
    _userIsInRoles.userId = user ? (( typeof user === 'string' ) ? user : user._id ) : null;
    _userIsInRoles.reqRoles = roles ? (( typeof roles === 'string' ) ? [ roles ] : [ ...roles ]) : [];
    let ret;

    // if no user is connected, then we return false, unless no roles is requested
    if( !user ){
        _userIsInRoles.userRoles = [];
        ret = ( _userIsInRoles.reqRoles.length === 0 );

    } else {
        _userIsInRoles.userRoles = alRoles.getRolesForUser( user, options );

        // if no role is requested, then user is always allowed
        if( _userIsInRoles.reqRoles.length === 0 ){
            ret = true;
        } else {
            ret = alRoles.userIsInRole( user, roles, options );
        }
    }

    // have a change ?
    if( prevId !== _userIsInRoles.userId || !_.isEqual( prevRoles, _userIsInRoles.usersRoles ) || !_isEqual( prevReq, _userIsInRoles.reqRoles )){
        _userIsInRoles.dep.changed();
    }
    return ret;
}
