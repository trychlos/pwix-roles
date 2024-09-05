/*
 * pwix:roles/src/common/js/functions.js
 */

import _ from 'lodash';

import { Roles as alRoles } from 'meteor/alanning:roles';

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
    _enum( Roles.configure().roles.hierarchy || [] );
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
                if( Roles._isParent( f, role )){
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
 * NB; both in pwix:roles and in alanning:roles, when a role is scoped, all inherited roles are also scoped
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
 * @param {Array|Object|String} users an array of objects, or an object, or an array of strings, or a string identifier
 * @returns {Array} an array of string identifiers
 */
Roles._idsFromUsers = function( users ){
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

/*
 * @param {String} a
 * @param {String} b
 * @returns {Boolean} true if a is parent of b
 */
Roles._isParent = function( a, b ){
    return Roles._parents( b ).includes( a );
}

/*
 * Build an array which contains the ordered list of the parent(s) of the specified role
 * @param {String} role
 * @returns {Array} the ordered parents, not including the given role
 */
Roles._parents = function( role ){
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
    Roles.configure().roles.hierarchy.every(( o ) => {
        parents = [];
        return f_search( o );
    });
    //console.log( 'Roles._parents of', role, 'are', parents );
    return parents;
}

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
    const h = Roles._conf && Roles.configure().roles && Roles.configure().roles.hierarchy ? Roles.configure().roles.hierarchy : [];
    //console.debug( h );
    h.every(( o ) => {
        f_sort( o );
        return true;
    });
    //console.debug( 'sorted', sorted );
    return sorted;
};

/**
 * @param {Array} roles a list of roles
 * @returns {Array} a deep copy of the original roles hierarchy in which only the input roles are kept
 *  This let the caller get the whole hierarchy depending of the specified roles.
 */
Roles._userHierarchy = function( roles ){
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
    const h = Roles._conf && Roles.configure().roles && Roles.configure().roles.hierarchy ? Roles.configure().roles.hierarchy : [];
    h.every(( o ) => {
        f_filter( o );
        return true;
    });
    return filtered
}

/**
 * @summary Add roles to the users
 * @locus Anywhere
 * @param {Array|Object|String} users
 * @param {Array|String} roles
 * @param {Object} options
 */
Roles.addUsersToRoles = async function( users, roles, options={} ){
    return await ( Meteor.isClient ? Meteor.callAsync( 'Roles.addUsersToRoles', users, roles, options ) : alRoles.addUsersToRolesAsync( users, roles, options ));
}

/**
 * @summary Compare the roles assigned to two users and compute the highest side
 * @locus Anywhere
 * @param {Object|String} a user identifier or document
 * @param {Object|String} ab user identifier or document
 * @returns {Integer}
 *  -1 if highest role of user a is lower than highest role of user b
 *   0 if highest role of user a is same level than highest role of user b
 *  +1 if highest role of user a is higher than highest role of user b
 */
Roles.compareLevels = async function( userA, userB ){
    const rolesA = await Roles.directRolesForUser( userA );
    const levelA = Roles.highestLevel( rolesA );
    const rolesB = await Roles.directRolesForUser( userB );
    const levelB = Roles.highestLevel( rolesB );
    const res = levelA < levelB ? +1 : ( levelA > levelB ? -1 : 0 );
    //console.debug( userA, rolesA, levelA, userB, rolesB, levelB, res );
    return res;
}

/**
 * @summary Returns the direct roles of the user
 * @locus Anywhere
 * @param {Object|String} user User identifier or actual user object
 * @param {Object} options
 * @returns {Array} array of roles directly attributed to the user (i.e. having removed the inherited ones)
 */
Roles.directRolesForUser = async function( user, options={} ){
    return Roles._filter( await alRoles.getRolesForUser( user, options ));
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
    const h = Roles.configure().roles && Roles.configure().roles.hierarchy ? Roles.configure().roles.hierarchy : [];
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
 * @returns {Array} an array of roles documents
 */
Roles.getRolesForUser = async function( user, options={} ){
    return await ( Meteor.isClient ? Meteor.callAsync( 'Roles.getRolesForUser', user, options ) : Meteor.server.getRolesForUser( user, options ));
}

/**
 * @locus Anywhere
 * @param {String} scope the scope identifier
 * @returns {Array} on server side, an array of user identifiers which have a role in this scope
 */
Roles.getUsersInScope = async function( scope ){
    return await ( Meteor.isClient ? Meteor.callAsync( 'Roles.getUsersInScope', scope ) : Roles.server.getUsersInScope( scope ));
}

/**
 * @summary Compute the highest level among the provided list of roles
 * @locus Anywhere
 * @param {Array} roles
 * @returns {Integer} the level number, '0' being the root of the role hierarchy.
 *  NB 1: the lower this level, the higher the role is in the hierarchy.
 *  NB 2: as a consequence, returns a very high level if the roles are empty (no role implies very low level in the hierarchy)
 */
Roles.highestLevel = function( roles ){
    let lowestLevel = Number.MAX_VALUE;
    const hierarchy = Roles.configure().roles?.hierarchy || [];
    roles.forEach(( role ) => {
        //console.debug( 'role', role );
        let roleLevel = Number.MAX_VALUE;
        const f_rec = function( it, level=0 ){
            let found = false;
            //console.debug( 'examining', it, 'at', level );
            if( it.name === role ){
                roleLevel = level;
                found = true;
                //console.debug( 'found at level', level );
            }
            if( !found && it.children ){
                it.children.forEach(( child ) => {
                    found = f_rec( child, level+1 );
                });
            }
            return !found;
        }
        hierarchy.every(( it ) => {
            const found = f_rec( it );
            return !found;
        });
        if( roleLevel < lowestLevel ){
            lowestLevel = roleLevel;
        }
    });
    return lowestLevel;
}

/**
 * @param {String} action
 * @param {String} userId
 * @returns {Boolean} true if the current user is allowed to do the action
 */
Roles.isAllowed = async function( action, userId=null ){
    // not very desirable nor secure, but compatible
    let allowed = true;
    const fn = Roles.configure().allowFn;
    if( fn ){
        allowed = await fn( action, userId );
    }
    return allowed;
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
 * @param {Object} user a user identifier or a user object
 */
Roles.removeAllRolesFromUser = async function( user ){
    console.warn( 'removeAllRolesFromUser() is obsoleted started with v1.3.2. Please use removeAssignedRolesFromUser()' );
    return await Roles.removeAssignedRolesFromUser( user );
}

/**
 * @param {Object} user a user identifier or a user object
 */
Roles.removeAssignedRolesFromUser = async function( user ){
    return await ( Meteor.isClient ? Meteor.callAsync( 'Roles.removeAssignedRolesFromUser', user ) : Roles.server.removeAssignedRolesFromUser( user ));
}

/**
 * @param {Array|String} roles a role or an array of roles
 * @param {Object} opts an option object with following keys:
 *  - scope: the relevant scope, all scopes if not set
 */
Roles.removeUserAssignmentsForRoles = async function( roles, opts ){
    console.warn( 'removeUserAssignmentsForRoles() is obsoleted started with v1.3.2. Please use removeUserAssignmentsFromRoles()' );
    return await Roles.removeUserAssignmentsFromRoles( roles, opts );
}

/**
 * @locus Anywhere
 * @param {Array|String} roles a role or an array of roles
 * @param {Object} opts an option object with following keys:
 *  - scope: the relevant scope, all scopes if not set
 */
Roles.removeUserAssignmentsFromRoles = async function( roles, opts ){
    return await ( Meteor.isClient ? Meteor.callAsync( 'Roles.removeUserAssignmentsFromRoles', roles, opts ) : Roles.server.removeUserAssignmentsFromRoles( roles, opts ));
}

/**
 * @locus Anywhere
 * @returns {Array} array of scoped roles (children are not returned here but are scoped per definition)
 */
Roles.scopedRoles = function(){
    let scoped = [];
    Roles._enumerate(( r ) => {
        if( r.scoped === true ){
            scoped.push( r );
        }
        return true;
    });
    return scoped;
}

/**
 * @locus Anywhere
 * @param {String|Object} user the user identifier or the user document
 * @param {Object} roles the roles to be set as an object { global: { direct[] }, scoped: { <scope>: { direct: [] }}}
 */
Roles.setUserRoles = async function( user, roles ){
    return await ( Meteor.isClient ? Meteor.callAsync( 'Roles.setUserRoles', user, roles ) : Roles.server.setUserRoles( user, roles ));
}

/**
 * @summary Provide a default to allowFn() permissions manager
 * @locus Anywhere
 * @returns {Object} the suggested permissions
 *  These are NOT default as the internal permissions manager doesn't care of these and actually defaults to `true`.
 */
Roles.suggestedPermissions = function(){
    return {
        pwix: {
            roles: {
                fn: {
                    async getRolesForUser( userId, user ){
                        return userId !== null;
                    },
                    async getUsersInScope( userId, scope ){
                        return userId !== null;
                    },
                    async removeAssignedRolesFromUser( userId, user ){
                        return userId !== null;
                    },
                    async removeUserAssignmentsFromRoles( userId, roles ){
                        return userId !== null;
                    },
                    async setUserRoles( userId, user, roles ){
                        return userId !== null;
                    },
                    async usedScopes( userId ){
                        return userId !== null;
                    }
                },
                method: {
                    async addUsersToRoles( userId, users ){
                        return userId !== null;
                    },
                    async countUsersInRoles( userId, roles ){
                        return userId !== null;
                    },
                    async createRole( userId, role ){
                        return userId !== null;
                    }
                },
                pub: {
                    // this should be allowed to all while the app admin role is not attributed - after that, a user needs to be connected
                    //  but - chicken and eggs problem - that is same than allowing the above countUsersInRoles() method
                    async count_by_roles( userId, roles ){
                        return true;
                    },
                    async user_assignments( userId, user ){
                        return userId !== null;
                    },
                    async used_scopes( userId ){
                        return userId !== null;
                    }
                }
            }
        }
    };
}

/**
 * @locus Anywhere
 * @returns {Promise} which eventually resolve to an array of used scopes (most probably including the 'null' one)
 */
Roles.usedScopes = async function(){
    return await ( Meteor.isClient ? Meteor.callAsync( 'Roles.usedScopes' ) : Roles.server.usedScopes());
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
Roles.userIsInRoles = async function( user, roles, options={} ){
    let result = false;
    let userId = _.isString( user ) ? user : ( _.isObject( user ) && user._id ? user._id : null );
    if( userId ){
        result = await alRoles.userIsInRoleAsync( user, roles, options );
    }
    return result;
}

