/*
 * pwix:roles/src/server/js/functions.js
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict;

import { Roles as alRoles } from 'meteor/alanning:roles';

Roles.s = {
    // get roles for the user
    // https://meteor-community-packages.github.io/meteor-roles/classes/Roles.html#method_getRolesForUserAsync
    // returns Promise null if an error occurred
    async getRolesForUser( user, options, userId=null ){
        try {
            const allowed = await Roles.isAllowed('pwix.roles.fn.getRolesForUser', userId, user );
            if( allowed ){
                return await alRoles.getRolesForUserAsync( user, options );
            }
            //console.log( 'pwix.roles.fn.getRolesForUser', user, 'not allowed' );
            return null;
        }
        catch( e ){
            console.error( 'pwix.roles.fn.getRolesForUser', e );
            return null;
        }
    },

    // get users in scope
    // returns a Promise which resolves to the list of users in this scope, which may be an empty array, or null if an error occurred
    async getUsersInScope( scope, userId=null ){
        assert( scope && scope.length && _.isString( scope ), 'expect a scope, got', scope );
        try {
            const allowed = await Roles.isAllowed( 'pwix.roles.fn.getUsersInScope', userId );
            if( allowed ){
                const fetched = await Meteor.roleAssignment.find({ scope: scope }).fetchAsync();
                result = [];
                fetched.every(( it ) => {
                    result.push( user._id );
                    return true;
                });
                return result;
            }
            //console.log( 'pwix.roles.fn.getUsersInScope not allowed' );
            return null;
        }
        catch( e ){
            console.error( 'pwix.roles.fn.getUsersInScope', e );
            return null;
        }
    },

    // remove all roles for the user
    //  returns a Promise which resolves to true|false
    async removeAllRolesFromUser( user ){
        console.warn( 'removeAllRolesFromUser() is obsoleted started with v1.3.2. Please use removeAssignedRolesFromUser()' );
        return await Roles.s.removeAssignedRolesFromUser( user );
    },

    // remove all roles for the user
    //  returns true|false, or null if an error occurred
    async removeAssignedRolesFromUser( user, userId=null ){
        try {
            const allowed = await Roles.isAllowed( 'pwix.roles.fn.removeAssignedRolesFromUser', userId )
            if( allowed ){
                if( user ){
                    let id = null;
                    if( _.isString( user )){
                        id = user;
                    } else if( _.isObject( user ) && user._id ){
                        id = user._id;
                    }
                    if( id ){
                        const countDeleted = await Meteor.roleAssignment.removeAsync({ 'user._id': id });
                        console.debug( 'pwix.roles.fn.removeAssignedRolesFromUser', user, countDeleted );
                        return countDeleted !== null;
                    }
                    console.warn( 'pwix.roles.fn.removeAssignedRolesFromUser() unable to find an identifier', user );
                    return null;
                }
                console.warn( 'pwix.roles.fn.removeAssignedRolesFromUser() user is falsy', user );
                return null;
            }
            //console.log( 'pwix.roles.fn.removeAssignedRolesFromUser not allowed' );
            return null;
        }
        catch( e ) {
            console.error( 'pwix.roles.fn.removeAssignedRolesFromUser', e );
            return null;
        }
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves an array of the result for each role
    async removeUserAssignmentsForRoles( roles, opts, userId=null ){
        console.warn( 'removeUserAssignmentsForRoles() is obsoleted started with v1.3.2. Please use removeUserAssignmentsFromRoles()' );
        return await Roles.s.removeUserAssignmentsFromRoles( roles, opts, userId );
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves to an array of the result for each role, or null if an error occurred
    async removeUserAssignmentsFromRoles( roles, opts={}, userId=null ){
        try {
            const allowed = await Roles.isAllowed( 'pwix.roles.fn.removeUserAssignmentsFromRoles', userId );
            if( allowed ){
                let promises = [];
                const rolesArray = _.isArray( roles ) ? roles : [roles];
                rolesArray.forEach(( role ) => {
                    let query = {
                        'role._id': role
                    };
                    if( opts.scope ){
                        query.scope = opts.scope;
                    }
                    promises.push( Meteor.roleAssignment.removeAsync( query ));
                });
                return Promise.allSettled( promises );
            }
            //console.log( 'pwix.roles.fn.removeUserAssignmentsFromRoles not allowed' );
            return null;
        }
        catch( e ) {
            console.error( 'pwix.roles.fn.removeUserAssignmentsFromRoles', e );
            return null;
        }
    },

    // reset all assignment for a scope
    async resetScopedAssignments( scope, assignments, userId=null ){
        const allowed = true;   // BAD!
        let res = null;
        if( allowed ){
            res = [];
            res.deleted = await Meteor.roleAssignment.removeAsync({ scope: scope });
            res.assigned = 0;
            for await( it of assignments ){
                await alRoles.addUsersToRolesAsync( it.user._id, it.role._id, { scope: scope });
                res.assigned += 1;
            };
        }
        console.debug( 'res', res );
        return res;
    },

    // replace the roles of the user
    //  return true|false, or null if an error occurred
    async setUserRoles( user, roles, userId=null ){
        let targetId = null;
        let isAllowed = false;
        try {
            return Roles.isAllowed( 'pwix.roles.fn.setUserRoles', userId )
                .then(( allowed ) => {
                    isAllowed = allowed;
                    if( allowed ){
                        targetId = _.isString( user ) ? user : ( user._id ? user._id : null );
                        if( targetId ){
                            return Roles.s.removeAssignedRolesFromUser( user );
                        } else {
                            console.warn( 'pwix.roles.fn.setUserRoles unable to get a user identifier from provided user argument', user );
                            return null;
                        }
                    } else {
                        //console.log( 'pwix.roles.fn.setUserRoles not allowed' );
                        return null;
                    }
                })
                .then(() => {
                    if( isAllowed && targetId ){
                        return alRoles.setUserRolesAsync( user, roles.global.direct, { anyScope: true });
                    }
                })
                .then(() => {
                    if( isAllowed && targetId ){
                        return Promise.allSettled( Object.keys( roles.scoped ).map( async ( it ) => {
                            return await alRoles.setUserRolesAsync( user, roles.scoped[it].direct, { scope: it });
                        }));
                    }
                })
                .then(() => {
                    if( isAllowed && targetId ){
                        return Meteor.users.rawCollection().updateOne({ _id: targetId }, { $set: {
                            updatedAt: new Date(),
                            updatedBy: userId
                        }});
                    }
                });
        }
        catch( e ) {
            console.error( 'pwix.roles.fn.setUserRoles', e );
            return null;
        }
    },

    // returns the list of used scopes
    async usedScopes( userId=null){
        try {
            const allowed = await Roles.isAllowed( 'pwix.roles.fn.usedScopes', userId );
            if( allowed ){
                return await Meteor.roleAssignment.rawCollection().distinct( 'scope' );
            }
            //console.log( 'pwix.roles.fn.usedScopes not allowed' );
            return null;
        }
        catch( e ) {
            console.error( 'pwix.roles.fn.usedScopes', e );
            return null;
        }
    }
};
