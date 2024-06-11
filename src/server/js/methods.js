/*
 * pwix:roles/src/server/js/methods.js
 */

import _ from 'lodash';

import { Roles as alRoles } from 'meteor/alanning:roles';

//const rolesAssignment = Mongo.Collection( 'role-assignment' );
//console.log( Mongo );

Meteor.methods({
    // returns the count of users which have at least one of the specified roles
    async 'Roles.addUsersToRoles'( users, roles, options={} ){
        alRoles.addUsersToRolesAsync( users, roles, options );
        console.log( 'pwix:roles/src/server/js/methods:addUsersToRoles()' );
    },

    // returns the count of users which have at least one of the specified roles
    async 'Roles.countUsersInRoles'( roles, options={} ){
        const res = alRoles.getUsersInRoleAsync( roles, options ).count();
        console.log( 'pwix:roles/src/server/js/methods:countUsersInRoles()', roles, res );
        return res;
    },

    // create a new role (when we do not want manage it in the hierarchy)
    async 'Roles.createRole'( role, options={} ){
        const res = alRoles.createRoleAsync( role, options );
        console.log( 'pwix:roles/src/server/js/methods:createRole()', res );
        return res;
    },

    // return roles for the user
    async 'Roles.getRolesForUser'( user, options ){
        return Roles.server.getRolesForUser( user, options );
    },

    // filter roles assignments for a scope
    async 'Roles.getUsersInScope'( scope ){
        return Roles.server.getUsersInScope( scope );
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
    //  this must be a method as the (not trusted) client cannot directly remove assignments without its id
    async 'Roles.setUsersRoles'( users, roles ){
        let promises = [];
        const ids = Roles.idsFromUsers( users );
        ids.every(( id ) => {
            promises.push( Meteor.roleAssignment.removeAsync({ 'user._id': id }));
        });
        return Promise.all( promises ).then(() => { return alRoles.addUsersToRolesAsync( users, roles ); });
    }
});
