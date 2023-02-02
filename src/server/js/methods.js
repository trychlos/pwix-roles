/*
 * pwix:roles/src/server/js/methods.js
 */

import { Roles } from 'meteor/alanning:roles';

import '../../common/js/index.js';

//const rolesAssignment = Mongo.Collection( 'role-assignment' );
//console.log( Mongo );

Meteor.methods({
    // returns the count of users which have at least one of the specified roles
    'pwiRoles.countUsersInRoles'( roles ){
        const res = Roles.getUsersInRole( roles ).count();
        console.log( 'pwix:roles/src/server/js/methods:countUsersInRoles()', roles, res );
        return res;
    },

    // replace the user's roles with a new set
    //  this must be a method as the (not trusted) client cannot directly remove assignments without its id
    'pwiRoles.setUsersRoles'( users, roles ){
        const ids = pwiRoles.idsFromUsers( users );
        ids.every(( id ) => {
            Meteor.roleAssignment.remove({ 'user._id': id });
        });
        Roles.addUsersToRoles( users, roles );
    }
});
