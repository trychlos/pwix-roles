/*
 * pwix:roles/src/server/js/methods.js
 */

import _ from 'lodash';

import { Roles as alRoles } from 'meteor/alanning:roles';

//const rolesAssignment = Mongo.Collection( 'role-assignment' );
//console.log( Mongo );

Meteor.methods({
    // assign the role(s) to the user(s)
    //  alRoles doesn't return any value
    async 'Roles.addUsersToRoles'( users, roles, options={} ){
        await Roles.isAllowed( 'pwix.roles.method.addUsersToRoles', users ).then(( allowed ) => {
            if( allowed ){
                return alRoles.addUsersToRolesAsync( users, roles, options );
                //console.log( 'pwix.roles.method.addUsersToRoles()', res );    // undefined
            } else {
                console.log( 'pwix.roles.method.addUsersToRoles not allowed' );
                return null;
            }
        });
    },

    // returns the count of users which have at least one of the specified roles
    async 'Roles.countUsersInRoles'( roles, options={} ){
        const res = await Roles.isAllowed( 'pwix.roles.method.countUsersInRoles' ).then(( allowed ) => {
            if( allowed ){
                return alRoles.getUsersInRoleAsync( roles, options ).count();
            } else {
                console.log( 'pwix.roles.method.countUsersInRoles not allowed' );
                return null;
            }
        });
        //console.log( 'pwix.roles.method.countUsersInRoles', roles, res );
        return res;
    },

    // create a new role (when we do not want manage it in the hierarchy)
    async 'Roles.createRole'( role, options={} ){
        const res = await Roles.isAllowed( 'pwix.roles.method.createRole' ).then(( allowed ) => {
            if( allowed ){
                return alRoles.createRoleAsync( role, options );
            } else {
                console.log( 'pwix.roles.method.createRole not allowed' );
                return null;
            }
        });
        //console.log( 'pwix.roles.method.createRole', res );
        return res;
    },

    // return roles for the user
    async 'Roles.getRolesForUser'( user, options ){
        return await Roles.server.getRolesForUser( user, options );
    },

    // filter roles assignments for a scope
    async 'Roles.getUsersInScope'( scope ){
        return await Roles.server.getUsersInScope( scope );
    },

    // remove all roles for the user
    async 'Roles.removeAllRolesFromUser'( user ){
        console.warn( 'removeAllRolesFromUser() is obsoleted started with v1.3.2. Please use removeAssignedRolesFromUser()' );
        return await Roles.server.removeAssignedRolesFromUser( user );
    },

    // remove all roles for the user
    async 'Roles.removeAssignedRolesFromUser'( user ){
        return await Roles.server.removeAssignedRolesFromUser( user );
    },

    // remove all assignments for a role
    async 'Roles.removeUserAssignmentsForRoles'( roles, opts ){
        console.warn( 'removeUserAssignmentsForRoles() is obsoleted started with v1.3.2. Please use removeUserAssignmentsFromRoles()' );
        return await Roles.server.removeUserAssignmentsFromRoles( roles, opts );
    },

    // remove all assignments for a role
    async 'Roles.removeUserAssignmentsFromRoles'( roles, opts ){
        return await Roles.server.removeUserAssignmentsFromRoles( roles, opts );
    },

    // replace the user's roles with a new set
    async 'Roles.setUserRoles'( user, roles ){
        return await Roles.server.setUserRoles( user, roles, Meteor.userId());
    },

    // returns the used scopes
    async 'Roles.usedScopes'(){
        return await Roles.server.usedScopes();
    }
});
