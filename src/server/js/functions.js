/*
 * pwix:roles/src/server/js/functions.js
 */

import _ from 'lodash';

Roles.server = {
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
