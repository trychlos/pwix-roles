/*
 * pwix:roles/src/server/js/methods.js
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { Roles as alRoles } from 'meteor/alanning:roles';

const logger = Logger.get();

//const rolesAssignment = Mongo.Collection( 'role-assignment' );
//logger.log( Mongo );

Meteor.methods({
    // assign the role(s) to the user(s)
    //  alRoles doesn't return any value
    async 'pwix.Roles.m.addUsersToRoles'( users, roles, options={} ){
        const allowed = await Roles.isAllowed( 'pwix.roles.method.addUsersToRoles', this.userId, users );
        if( allowed ){
            const res = await alRoles.addUsersToRolesAsync( users, roles, options );
            //logger.log( 'pwix.roles.method.addUsersToRoles()', res );    // undefined
            return res;
        }
        //logger.log( 'pwix.roles.method.addUsersToRoles not allowed' );
        return null;
    },

    // return all roles for the user
    async 'pwix.Roles.m.allRolesForUser'( target ){
        return await Roles.s.allRolesForUser( target, this.userId );
    },

    // returns the count of users which have at least one of the specified roles
    async 'pwix.Roles.m.countUsersInRoles'( roles, options={} ){
        const allowed = await Roles.isAllowed( 'pwix.roles.method.countUsersInRoles', this.userId );
        if( allowed ){
            const res = await alRoles.getUsersInRoleAsync( roles, options ).count();
            //logger.log( 'pwix.roles.method.countUsersInRoles', roles, res );
            return res;
        }
        //logger.log( 'pwix.roles.method.countUsersInRoles not allowed' );
        return null;
    },

    // create a new role (when we do not want manage it in the hierarchy)
    async 'pwix.Roles.m.createRole'( role, options={} ){
        const allowed = await Roles.isAllowed( 'pwix.roles.method.createRole', this.userId );
        if( allowed ){
            const res = alRoles.createRoleAsync( role, options );
            //logger.log( 'pwix.roles.method.createRole', res );
            return res;
        }
        //logger.log( 'pwix.roles.method.createRole not allowed' );
        return null;
    },

    // return roles for the user
    async 'pwix.Roles.m.getRolesForUser'( user, options ){
        logger.warn( 'getRolesForUser() is obsoleted started with v1.9. Please use allRolesForUser()' );
        return await Roles.s.getRolesForUser( user, options, this.userId );
    },

    // filter roles assignments for a scope
    async 'pwix.Roles.m.getUsersInScope'( scope ){
        return await Roles.s.getUsersInScope( scope, this.userId );
    },

    // remove all roles for the user
    async 'pwix.Roles.m.removeAllRolesFromUser'( user ){
        logger.warn( 'removeAllRolesFromUser() is obsoleted started with v1.3.2. Please use removeAssignedRolesFromUser()' );
        return await Roles.s.removeAssignedRolesFromUser( user, this.userId );
    },

    // remove all roles for the user
    async 'pwix.Roles.m.removeAssignedRolesFromUser'( user ){
        return await Roles.s.removeAssignedRolesFromUser( user, this.userId );
    },

    // remove all assignments for a role
    async 'pwix.Roles.m.removeUserAssignmentsForRoles'( roles, opts ){
        logger.warn( 'removeUserAssignmentsForRoles() is obsoleted started with v1.3.2. Please use removeUserAssignmentsFromRoles()' );
        return await Roles.s.removeUserAssignmentsFromRoles( roles, opts, this.userId );
    },

    // remove all assignments for a role
    async 'pwix.Roles.m.removeUserAssignmentsFromRoles'( roles, opts ){
        return await Roles.s.removeUserAssignmentsFromRoles( roles, opts, this.userId );
    },

    // replace all assignments for a scope
    // the method returns the reason for why it has not been successful
    async 'pwix.Roles.m.resetScopedAssignments'( scope, assignments, opts={} ){
        try {
            return await Roles.s.resetScopedAssignments( scope, assignments, opts, this.userId );
        } catch( e ){
            return e.message;
        }
    },

    // replace the user's roles with a new set
    async 'pwix.Roles.m.setUserRoles'( user, roles ){
        return await Roles.s.setUserRoles( user, roles, this.userId );
    },

    // returns the used scopes
    async 'pwix.Roles.m.usedScopes'(){
        return await Roles.s.usedScopes( this.userId );
    }
});
