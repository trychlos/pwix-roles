/*
 * pwix:roles/src/server/js/functions.js
 */

import _ from 'lodash';

Roles.server = {
    // get roles for the user
    // return a Promise which resolves to the array of roles for the user (which may be empty)
    async getRolesForUser( user, options ){
        let result = Promise.resolve( [] );
        if( user ){
            let id = null;
            if( _.isString( user )){
                id = user;
            } else if( _.isObject( user ) && user._id ){
                id = user._id;
            }
            if( id ){
                return Meteor.roleAssignment.find({ 'user._id': id }).fetchAsync()
                    .then(( fetched ) => {
                        result = [];
                        fetched.every(( doc ) => {
                            if( options.onlyScoped === true ){
                                if(( doc.scope && options.scope && doc.scope === options.scope ) || ( !options.scope && !doc.scope )){
                                    result.push({ _id: doc.role._id, scope: doc.scope || null });
                                }
                            } else {
                                result.push({ _id: doc.role._id, scope: doc.scope || null });
                            }
                            return true;
                        });
                        return result;
                    });
            } else {
                console.warn( 'getRolesForUser() unable to find an identifier', user );
            }
        } else {
            console.warn( 'getRolesForUser() user is falsy', user );
        }
        return result;
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

    // returns the list of used scopes
    async usedScopes(){
        return Meteor.roleAssignment.rawCollection().distinct( 'scope' );
    }
};
