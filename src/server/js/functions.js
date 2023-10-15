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
    }
};
