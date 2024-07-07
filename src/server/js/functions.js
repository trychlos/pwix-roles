/*
 * pwix:roles/src/server/js/functions.js
 */

import _ from 'lodash';

import { Roles as alRoles } from 'meteor/alanning:roles';

Roles.server = {
    // get roles for the user
    // https://meteor-community-packages.github.io/meteor-roles/classes/Roles.html#method_getRolesForUserAsync
    async getRolesForUser( user, options ){
        const res = await alRoles.getRolesForUserAsync( user, options );
        //console.debug( 'res', res );
        return res;
    },

    // get users in scope
    // returns a Promise which resolves to the list of users in this scope, or null
    async getUsersInScope( scope ){
        let result = Promise.resolve( [] );
        if( scope && scope.length && _.isString( scope )){
            return Meteor.roleAssignment.find({ scope: scope }).fetchAsync()
                .then(( fetched ) => {
                    result = [];
                    fetched.every(( it ) => {
                        result.push( user._id );
                        return true;
                    });
                    return result;
                });

        }
        return result;
    },

    // remove all roles for the user
    //  returns a Promise which resolves to true|false
    async removeAllRolesFromUser( user ){
        console.warn( 'removeAllRolesFromUser() is obsoleted started with v1.3.2. Please use removeAssignedRolesFromUser()' );
        return await Roles.server.removeAssignedRolesFromUser( user );
    },

    // remove all roles for the user
    //  returns true|false
    async removeAssignedRolesFromUser( user ){
        let result = false;
        if( user ){
            let id = null;
            if( _.isString( user )){
                id = user;
            } else if( _.isObject( user ) && user._id ){
                id = user._id;
            }
            if( id ){
                result = await Meteor.roleAssignment.removeAsync({ 'user._id': id });
            } else {
                console.warn( 'removeAssignedRolesFromUser() unable to find an identifier', user );
            }
        } else {
            console.warn( 'removeAssignedRolesFromUser() user is falsy', user );
        }
        return result;
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves an array of the result for each role
    async removeUserAssignmentsForRoles( roles, opts ){
        console.warn( 'removeUserAssignmentsForRoles() is obsoleted started with v1.3.2. Please use removeUserAssignmentsFromRoles()' );
        return await Roles.server.removeUserAssignmentsFromRoles( roles, opts );
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves to an array of the result for each role
    async removeUserAssignmentsFromRoles( roles, opts={} ){
        let promises = [];
        const rolesArray = _.isArray( roles ) ? roles : [roles];
        rolesArray.every(( role ) => {
            let query = {
                'role._id': role
            };
            if( opts.scope ){
                query.scope = opts.scope;
            }
            promises.push( Meteor.roleAssignment.removeAsync( query ));
            //console.debug( 'removeUserAssignmentsFromRoles()', 'query', query, 'ret', ret );
            return true;
        });
        return Promise.all( promises );
    },

    // replace the roles of the user
    async setUserRoles( user, roles, userId=0 ){
        const user_id = _.isString( user ) ? user : ( user._id ? user._id : null );
        if( user_id ){
            await Roles.server.removeAssignedRolesFromUser( user );
            await alRoles.setUserRolesAsync( user, roles.global.direct, { anyScope: true });
            Object.keys( roles.scoped ).forEach( async ( it ) => {
                await alRoles.setUserRolesAsync( user, roles.scoped[it].direct, { scope: it });
            });
            await Meteor.users.updateAsync({ _id: user_id }, { $set: {
                updatedAt: new Date(),
                updatedBy: userId
            }});
        } else {
            console.warn( 'unable to get a user identifier from provided user argument', user );
        }
    },

    // returns the list of used scopes
    async usedScopes(){
        return await Meteor.roleAssignment.rawCollection().distinct( 'scope' );
    }
};
