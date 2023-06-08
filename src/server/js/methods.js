/*
 * pwix:roles/src/server/js/methods.js
 */

import { Roles } from 'meteor/alanning:roles';

//const rolesAssignment = Mongo.Collection( 'role-assignment' );
//console.log( Mongo );

Meteor.methods({
    // returns the count of users which have at least one of the specified roles
    'pwixRoles.addUsersToRoles'( users, roles, options={} ){
        Roles.addUsersToRoles( users, roles, options );
        console.log( 'pwix:roles/src/server/js/methods:addUsersToRoles()' );
    },

    // returns the count of users which have at least one of the specified roles
    'pwixRoles.countUsersInRoles'( roles, options={} ){
        const res = Roles.getUsersInRole( roles, options ).count();
        console.log( 'pwix:roles/src/server/js/methods:countUsersInRoles()', roles, res );
        return res;
    },

    // create a new role (when we do not want manage it in the hierarchy)
    'pwixRoles.createRole'( role, options={} ){
        const res = Roles.createRole( role, options );
        console.log( 'pwix:roles/src/server/js/methods:createRole()', res );
        return res;
    },

    // replace the user's roles with a new set
    //  this must be a method as the (not trusted) client cannot directly remove assignments without its id
    'pwixRoles.setUsersRoles'( users, roles ){
        const ids = pwixRoles.idsFromUsers( users );
        ids.every(( id ) => {
            Meteor.roleAssignment.remove({ 'user._id': id });
        });
        Roles.addUsersToRoles( users, roles );
    }
});
