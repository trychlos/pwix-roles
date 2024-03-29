/*
 * pwix:roles/src/server/js/methods.js
 */

import { Roles as alRoles } from 'meteor/alanning:roles';

//const rolesAssignment = Mongo.Collection( 'role-assignment' );
//console.log( Mongo );

Meteor.methods({
    // returns the count of users which have at least one of the specified roles
    'Roles.addUsersToRoles'( users, roles, options={} ){
        alRoles.addUsersToRoles( users, roles, options );
        console.log( 'pwix:roles/src/server/js/methods:addUsersToRoles()' );
    },

    // returns the count of users which have at least one of the specified roles
    'Roles.countUsersInRoles'( roles, options={} ){
        const res = alRoles.getUsersInRole( roles, options ).count();
        console.log( 'pwix:roles/src/server/js/methods:countUsersInRoles()', roles, res );
        return res;
    },

    // create a new role (when we do not want manage it in the hierarchy)
    'Roles.createRole'( role, options={} ){
        const res = alRoles.createRole( role, options );
        console.log( 'pwix:roles/src/server/js/methods:createRole()', res );
        return res;
    },

    // replace the user's roles with a new set
    //  this must be a method as the (not trusted) client cannot directly remove assignments without its id
    'Roles.setUsersRoles'( users, roles ){
        const ids = Roles.idsFromUsers( users );
        ids.every(( id ) => {
            Meteor.roleAssignment.remove({ 'user._id': id });
        });
        alRoles.addUsersToRoles( users, roles );
    }
});
