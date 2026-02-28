/*
 * pwix:roles/src/server/js/functions.js
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict;

import { Logger } from 'meteor/pwix:logger';
import { Roles as alRoles } from 'meteor/alanning:roles';

const logger = Logger.get();

Roles.s = {
    // get roles for the user
    // https://meteor-community-packages.github.io/meteor-roles/classes/Roles.html#method_getRolesForUserAsync
    // returns Promise null if an error occurred
    async getRolesForUser( user, options, userId=null ){
        try {
            const allowed = await Roles.isAllowed( 'getRolesForUser', userId, user );
            if( allowed ){
                return await alRoles.getRolesForUserAsync( user, options );
            }
            //logger.log( 'getRolesForUser', user, 'not allowed' );
            return null;
        }
        catch( e ){
            logger.error( 'getRolesForUser()', e );
            return null;
        }
    },

    // get users in scope
    // returns a Promise which resolves to the list of users in this scope, which may be an empty array, or null if an error occurred
    async getUsersInScope( scope, userId=null ){
        assert( scope && scope.length && _.isString( scope ), 'expect a scope, got', scope );
        try {
            const allowed = await Roles.isAllowed( 'getUsersInScope', userId );
            if( allowed ){
                const fetched = await Meteor.roleAssignment.find({ scope: scope }).fetchAsync();
                result = [];
                fetched.every(( it ) => {
                    result.push( user._id );
                    return true;
                });
                return result;
            }
            //logger.log( 'getUsersInScope not allowed' );
            return null;
        }
        catch( e ){
            logger.error( 'getUsersInScope()', e );
            return null;
        }
    },

    // remove all roles for the user
    //  returns a Promise which resolves to true|false
    async removeAllRolesFromUser( user ){
        logger.warn( 'removeAllRolesFromUser() is obsoleted started with v1.3.2. Please use removeAssignedRolesFromUser()' );
        return await Roles.s.removeAssignedRolesFromUser( user );
    },

    // remove all roles for the user
    //  returns true|false, or null if an error occurred
    async removeAssignedRolesFromUser( user, userId=null ){
        try {
            const allowed = await Roles.isAllowed( 'removeAssignedRolesFromUser', userId )
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
                        logger.debug( 'removeAssignedRolesFromUser()', user, countDeleted );
                        return countDeleted !== null;
                    }
                    logger.warn( 'removeAssignedRolesFromUser() unable to find an identifier', user );
                    return null;
                }
                logger.warn( 'removeAssignedRolesFromUser() user is falsy', user );
                return null;
            }
            //logger.log( 'removeAssignedRolesFromUser() not allowed' );
            return null;
        }
        catch( e ) {
            logger.error( 'removeAssignedRolesFromUser()', e );
            return null;
        }
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves an array of the result for each role
    async removeUserAssignmentsForRoles( roles, opts, userId=null ){
        logger.warn( 'removeUserAssignmentsForRoles() is obsoleted started with v1.3.2. Please use removeUserAssignmentsFromRoles()' );
        return await Roles.s.removeUserAssignmentsFromRoles( roles, opts, userId );
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves to an array of the result for each role, or null if an error occurred
    async removeUserAssignmentsFromRoles( roles, opts={}, userId=null ){
        try {
            const allowed = await Roles.isAllowed( 'removeUserAssignmentsFromRoles', userId );
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
            //logger.log( 'removeUserAssignmentsFromRoles() not allowed' );
            return null;
        }
        catch( e ) {
            logger.error( 'removeUserAssignmentsFromRoles()', e );
            return null;
        }
    },

    // reset all assignment for a scope
    async resetScopedAssignments( scope, assignments, userId=null ){
        const allowed = true;   // BAD!
        let res = null;
        if( allowed ){
            res = {};
            res.deleted = await Meteor.roleAssignment.removeAsync({ scope: scope });
            res.assigned = 0;
            for await( it of assignments ){
                await alRoles.addUsersToRolesAsync( it.user._id, it.role._id, { scope: scope });
                res.assigned += 1;
            };
        }
        logger.debug( 'res', res );
        return res;
    },

    // replace the roles of the user
    //  return true|false, or null if an error occurred
    async setUserRoles( user, roles, userId=null ){
        let targetId = null;
        let isAllowed = false;
        try {
            return Roles.isAllowed( 'setUserRoles', userId )
                .then(( allowed ) => {
                    isAllowed = allowed;
                    if( allowed ){
                        targetId = _.isString( user ) ? user : ( user._id ? user._id : null );
                        if( targetId ){
                            return Roles.s.removeAssignedRolesFromUser( user );
                        } else {
                            logger.warn( 'setUserRoles unable to get a user identifier from provided user argument', user );
                            return null;
                        }
                    } else {
                        //logger.log( 'setUserRoles not allowed' );
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
            logger.error( 'setUserRoles()', e );
            return null;
        }
    },

    // returns the list of used scopes
    async usedScopes( userId=null){
        try {
            const allowed = await Roles.isAllowed( 'usedScopes', userId );
            if( allowed ){
                return await Meteor.roleAssignment.rawCollection().distinct( 'scope' );
            }
            //logger.log( 'usedScopes not allowed' );
            return null;
        }
        catch( e ) {
            logger.error( 'usedScopes()', e );
            return null;
        }
    }
};
