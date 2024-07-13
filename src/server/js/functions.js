/*
 * pwix:roles/src/server/js/functions.js
 */

import { count } from 'console';
import _ from 'lodash';
const assert = require( 'assert' ).strict;

import { Roles as alRoles } from 'meteor/alanning:roles';

Roles.server = {
    // get roles for the user
    // https://meteor-community-packages.github.io/meteor-roles/classes/Roles.html#method_getRolesForUserAsync
    // returns null if an error occurred
    async getRolesForUser( user, options ){
        try {
            return Roles.isAllowed( 'pwix.roles.fn.getRolesForUser', user )
                .then(( allowed ) => {
                    if( allowed ){
                        return alRoles.getRolesForUserAsync( user, options );
                    } else {
                        console.log( 'pwix.roles.fn.getRolesForUser', user, 'not allowed' );
                        return null;
                    }
                });
        }
        catch( e ){
            console.error( 'pwix.roles.fn.getRolesForUser', e );
            return null;
        }
    },

    // get users in scope
    // returns a Promise which resolves to the list of users in this scope, which may be an empty array, or null if an error occurred
    async getUsersInScope( scope ){
        assert( scope && scope.length && _.isString( scope ), 'expect a scope, got', scope );
        try {
            return Roles.isAllowed( 'pwix.roles.fn.getUsersInScope' )
                .then(( allowed ) => {
                    if( allowed ){
                        return Meteor.roleAssignment.find({ scope: scope }).fetchAsync();
                    } else {
                        console.log( 'pwix.roles.fn.getUsersInScope not allowed' );
                        return null;
                    }
                })
                .then(( fetched ) => {
                    if( fetched ){
                        result = [];
                        fetched.every(( it ) => {
                            result.push( user._id );
                            return true;
                        });
                        return result;
                    }
                });
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
        return await Roles.server.removeAssignedRolesFromUser( user );
    },

    // remove all roles for the user
    //  returns true|false, or null if an error occurred
    async removeAssignedRolesFromUser( user ){
        try {
            return Roles.isAllowed( 'pwix.roles.fn.removeAssignedRolesFromUser' )
                .then(( allowed ) => {
                    if( allowed ){
                        if( user ){
                            let id = null;
                            if( _.isString( user )){
                                id = user;
                            } else if( _.isObject( user ) && user._id ){
                                id = user._id;
                            }
                            if( id ){
                                return Meteor.roleAssignment.removeAsync({ 'user._id': id });
                            } else {
                                console.warn( 'pwix.roles.fn.removeAssignedRolesFromUser() unable to find an identifier', user );
                                return null;
                            }
                        } else {
                            console.warn( 'pwix.roles.fn.removeAssignedRolesFromUser() user is falsy', user );
                            return null;
                        }
                    } else {
                        console.log( 'pwix.roles.fn.removeAssignedRolesFromUser not allowed' );
                        return null;
                    }
                })
                .then(( countDeleted ) => {
                    if( countDeleted !== null ){
                        console.debug( 'pwix.roles.fn.removeAssignedRolesFromUser', user, countDeleted );
                    }
                    return countDeleted !== null;
                });
        }
        catch( e ) {
            console.error( 'pwix.roles.fn.removeAssignedRolesFromUser', e );
            return null;
        }
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves an array of the result for each role
    async removeUserAssignmentsForRoles( roles, opts ){
        console.warn( 'removeUserAssignmentsForRoles() is obsoleted started with v1.3.2. Please use removeUserAssignmentsFromRoles()' );
        return await Roles.server.removeUserAssignmentsFromRoles( roles, opts );
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves to an array of the result for each role, or null if an error occurred
    async removeUserAssignmentsFromRoles( roles, opts={} ){
        try {
            return Roles.isAllowed( 'pwix.roles.fn.removeUserAssignmentsFromRoles' )
                .then(( allowed ) => {
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
                    } else {
                        console.log( 'pwix.roles.fn.removeUserAssignmentsFromRoles not allowed' );
                        return null;
                    }
                });
        }
        catch( e ) {
            console.error( 'pwix.roles.fn.removeUserAssignmentsFromRoles', e );
            return null;
        }
    },

    // replace the roles of the user
    //  return true|false, or null if an error occurred
    async setUserRoles( user, roles, userId=0 ){
        let targetId = null;
        let isAllowed = false;
        try {
            return Roles.isAllowed( 'pwix.roles.fn.setUserRoles', userId )
                .then(( allowed ) => {
                    isAllowed = allowed;
                    if( allowed ){
                        targetId = _.isString( user ) ? user : ( user._id ? user._id : null );
                        if( targetId ){
                            return Roles.server.removeAssignedRolesFromUser( user );
                        } else {
                            console.warn( 'pwix.roles.fn.setUserRoles unable to get a user identifier from provided user argument', user );
                            return null;
                        }
                    } else {
                        console.log( 'pwix.roles.fn.setUserRoles not allowed' );
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
                            await alRoles.setUserRolesAsync( user, roles.scoped[it].direct, { scope: it });
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
    async usedScopes(){
        try {
            return Roles.isAllowed( 'pwix.roles.fn.usedScopes' )
                .then(( allowed ) => {
                    if( allowed ){
                        return Meteor.roleAssignment.rawCollection().distinct( 'scope' );
                    } else {
                        console.log( 'pwix.roles.fn.usedScopes not allowed' );
                        return null;
                    }
                });
        }
        catch( e ) {
            console.error( 'pwix.roles.fn.usedScopes', e );
            return null;
        }
    }
};
