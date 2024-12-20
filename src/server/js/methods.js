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
        const allowed = await Roles.isAllowed( 'pwix.roles.method.addUsersToRoles', this.userId, users );
        if( allowed ){
            const res = await alRoles.addUsersToRolesAsync( users, roles, options );
            //console.log( 'pwix.roles.method.addUsersToRoles()', res );    // undefined
            return res;
        }
        //console.log( 'pwix.roles.method.addUsersToRoles not allowed' );
        return null;
    },

    // returns the count of users which have at least one of the specified roles
    async 'Roles.countUsersInRoles'( roles, options={} ){
        const allowed = await Roles.isAllowed( 'pwix.roles.method.countUsersInRoles', this.userId );
        if( allowed ){
            const res = await alRoles.getUsersInRoleAsync( roles, options ).count();
            //console.log( 'pwix.roles.method.countUsersInRoles', roles, res );
            return res;
        }
        //console.log( 'pwix.roles.method.countUsersInRoles not allowed' );
        return null;
    },

    // create a new role (when we do not want manage it in the hierarchy)
    async 'Roles.createRole'( role, options={} ){
        const allowed = await Roles.isAllowed( 'pwix.roles.method.createRole', this.userId );
        if( allowed ){
            const res = alRoles.createRoleAsync( role, options );
            //console.log( 'pwix.roles.method.createRole', res );
            return res;
        }
        //console.log( 'pwix.roles.method.createRole not allowed' );
        return null;
    },

    // return roles for the user
    async 'Roles.getRolesForUser'( user, options ){
        return await Roles.s.getRolesForUser( user, options, this.userId );
    },

    // filter roles assignments for a scope
    async 'Roles.getUsersInScope'( scope ){
        return await Roles.s.getUsersInScope( scope, this.userId );
    },

    // remove all roles for the user
    async 'Roles.removeAllRolesFromUser'( user ){
        console.warn( 'removeAllRolesFromUser() is obsoleted started with v1.3.2. Please use removeAssignedRolesFromUser()' );
        return await Roles.s.removeAssignedRolesFromUser( user, this.userId );
    },

    // remove all roles for the user
    async 'Roles.removeAssignedRolesFromUser'( user ){
        return await Roles.s.removeAssignedRolesFromUser( user, this.userId );
    },

    // remove all assignments for a role
    async 'Roles.removeUserAssignmentsForRoles'( roles, opts ){
        console.warn( 'removeUserAssignmentsForRoles() is obsoleted started with v1.3.2. Please use removeUserAssignmentsFromRoles()' );
        return await Roles.s.removeUserAssignmentsFromRoles( roles, opts, this.userId );
    },

    // remove all assignments for a role
    async 'Roles.removeUserAssignmentsFromRoles'( roles, opts ){
        return await Roles.s.removeUserAssignmentsFromRoles( roles, opts, this.userId );
    },

    // replace all assignements for a scope
    async 'Roles.resetScopedAssignments'( scope, assignements ){
        return await Roles.s.resetScopedAssignments( scope, assignements, this.userId );
    },

    // replace the user's roles with a new set
    async 'Roles.setUserRoles'( user, roles ){
        return await Roles.s.setUserRoles( user, roles, this.userId );
    },

    // returns the used scopes
    async 'Roles.usedScopes'(){
        return await Roles.s.usedScopes( this.userId );
    }
});
