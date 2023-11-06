/*
 * pwix:roles/src/server/js/functions.js
 */

import _ from 'lodash';

Roles.server = {
    // get roles for the users  
    getRolesForUser( user, options ){
        let result = [];
        if( user ){
            let id = null;
            if( _.isString( user )){
                id = user;
            } else if( _.isObject( user ) && user._id ){
                id = user._id;
            }
            if( id ){
                Meteor.roleAssignment.find({ 'user._id': id }).fetch().every(( doc ) => {
                    if( options.onlyScoped === true ){
                        if(( doc.scope && options.scope && doc.scope === options.scope ) || ( !options.scope && !doc.scope )){
                            result.push({ _id: doc.role._id, scope: doc.scope || null });
                        }
                    } else {
                        result.push({ _id: doc.role._id, scope: doc.scope || null });
                    }
                    return true;
                });
            } else {
                console.warn( 'getRolesForUser() unable to find an identifier', user );
            }
        } else {
            console.warn( 'getRolesForUser() user is falsy', user );
        }
        return result;
    },

    // get user in scope
    getUsersInScope( scope ){
        let ret = [];
        if( scope && scope.length && _.isString( scope )){
            const assigns = Meteor.roleAssignment.find({ scope: scope }).fetch();
            assigns.every(( it ) => {
                ret.push( user._id );
                return true;
            })
        }
        return ret;
    },

    // remove all roles for the user
    //  returns true|false
    removeAllRolesFromUser( user ){
        let ret = -1;
        if( user ){
            let id = null;
            if( _.isString( user )){
                id = user;
            } else if( _.isObject( user ) && user._id ){
                id = user._id;
            }
            if( id ){
                ret = Meteor.roleAssignment.remove({ 'user._id': id });
            } else {
                console.warn( 'removeAllRolesFromUser() unable to find an identifier', user );
            }
        } else {
            console.warn( 'removeAllRolesFromUser() user is falsy', user );
        }
        console.debug( 'removeAllRolesFromUser() ret=', ret )
        return ret;
    }
};
