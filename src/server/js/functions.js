/*
 * pwix:roles/src/server/js/functions.js
 */

import _ from 'lodash';

Roles.server = {
    // get roles for the user
    // return a Promise which resolves to the array of roles for the user (which may be empty)
    getRolesForUser( user, options ){
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
    getUsersInScope( scope ){
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
    removeAllRolesFromUser( user ){
        let result = Promise.resolve( false );
        if( user ){
            let id = null;
            if( _.isString( user )){
                id = user;
            } else if( _.isObject( user ) && user._id ){
                id = user._id;
            }
            if( id ){
                result = Meteor.roleAssignment.removeAsync({ 'user._id': id });
            } else {
                console.warn( 'removeAllRolesFromUser() unable to find an identifier', user );
            }
        } else {
            console.warn( 'removeAllRolesFromUser() user is falsy', user );
        }
        return result;
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves an array of the result for each role
    removeUserAssignmentsForRoles( roles, opts ){
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
            //console.debug( 'removeUserAssignmentsForRoles()', 'query', query, 'ret', ret );
            return true;
        });
        return Promise.all( promises );
    }
};
