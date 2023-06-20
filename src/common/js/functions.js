/*
 * pwix:roles/src/common/js/functions.js
 */

import { Roles } from 'meteor/alanning:roles';
import { Tracker } from 'meteor/tracker';

import _ from 'lodash';

/*
 * Filter the provided array to remove inherited roles
 * @param {Array} array
 * @returns {Array}
 */
pwixRoles._filter = function( array ){
    //console.debug( 'filter in', array );
    let filtered = [];
    function f_filter( role ){
        if( !filtered.includes( role )){
            let hasParent = false;
            filtered.every(( f ) => {
                if( pwixRoles.isParent( f, role )){
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
    const sorted = pwixRoles._sort( array );
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
 * Sort the provided array in the hierarchy order
 * @param {Array} array
 * @returns {Array}
 */
pwixRoles._sort = function( array ){
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
    const h = pwixRoles._conf && pwixRoles._conf.roles && pwixRoles._conf.roles.hierarchy ? pwixRoles._conf.roles.hierarchy : [];
    //console.debug( h );
    h.every(( o ) => {
        f_sort( o );
        return true;
    });
    //console.debug( 'sorted', sorted );
    return sorted;
};

/**
 * @summary Returns the direct roles of the user
 * @locus Anywhere
 * @param {Object|String} user User identifier or actual user object
 * @returns {Array} array of roles directly attributed to the user (i.e. having removed the inherited ones)
 */
pwixRoles.directRolesForUser = function( user ){
    return pwixRoles._filter( Roles.getRolesForUser( user ));
}

/**
 * @param {Array|Object|String} users an array of objects, or an object, or an array of strings, or a string identifier
 * @returns {Array} an array of string identifiers
 */
pwixRoles.idsFromUsers = function( users ){
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
pwixRoles.isParent = function( a, b ){
    return pwixRoles.parents( b ).includes( a );
}

/**
 * Build an array which contains the ordered list of the parent(s) of the specified role
 * @param {String} role 
 * @returns {Array} the ordered parents, not including the given role
 */
pwixRoles.parents = function( role ){
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
    pwixRoles._conf.roles.hierarchy.every(( o ) => {
        parents = [];
        return f_search( o );
    });
    //console.log( 'pwixRoles.parents of', role, 'are', parents );
    return parents;
}

/**
 * @param {Array} roles a list of roles
 * @returns {Array} a deep copy the original roles hierarchy in which only the input roles are kept
 */
pwixRoles.userHierarchy = function( roles ){
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
    const h = pwixRoles._conf && pwixRoles._conf.roles && pwixRoles._conf.roles.hierarchy ? pwixRoles._conf.roles.hierarchy : [];
    h.every(( o ) => {
        f_filter( o );
        return true;
    });
    return filtered
}

/**
 * Check if user has specified roles.
 * A reactive data source.
 * @param {Object|String} user User identifier or actual user object
 * @param {Array|String} roles required roles as a string or an array of strings
 * @returns {Boolean} true if the user exhibits any of the required roles
 */
_userIsInRoles = {
    dep: null,
    userId: null,
    userRoles: [],
    reqRoles: []
};
pwixRoles.userIsInRoles = function( user, roles ){
    if( !_userIsInRoles.dep ){
        _userIsInRoles.dep = new Tracker.Dependency();
        _userIsInRoles.dep.depend();
    }
    //console.log( 'pwixRoles.userIsInRoles', user, roles );

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
        _userIsInRoles.userRoles = Roles.getRolesForUser( user );

        // if no role is requested, then user is always allowed
        if( _userIsInRoles.reqRoles.length === 0 ){
            ret = true;
        } else {
            ret = Roles.userIsInRole( user, roles );
        }
    }

    // have a change ?
    if( prevId !== _userIsInRoles.userId || !_.isEqual( prevRoles, _userIsInRoles.usersRoles ) || !_isEqual( prevReq, _userIsInRoles.reqRoles )){
        _userIsInRoles.dep.changed();
    }
    return ret;
}
