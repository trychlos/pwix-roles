/*
 * pwix:roles/src/server/js/functions.js
 */

import _ from 'lodash';
const assert = require( 'assert' ).strict;

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';
import { Mongo } from 'meteor/mongo';
import { pwixI18n } from 'meteor/pwix:i18n';
import { Roles as alRoles } from 'meteor/alanning:roles';

const logger = Logger.get();

Roles.s = {
    // add users to roles
    //  alanning:roles.addUsersToRolesAsync() doesn't return anything
    async addUsersToRoles( users, roles, opts, requesterId ){
        const allowed = await Roles.isAllowed( 'pwix.roles.fn.addUsersToRoles', requesterId, users, roles, opts );
        if( allowed ){
            await alRoles.addUsersToRolesAsync( users, roles, options );
        }
    },

    // get all roles for the user
    async allRolesForUser( target, requester=null ){
        logger.warn( 'allRolesForUser() is obsoleted started with v1.10. Please use getUserRoles()' );
        return await Roles.s.getUserRoles( target, requester );
    },

    // get roles for the user
    // https://meteor-community-packages.github.io/meteor-roles/classes/Roles.html#method_getRolesForUserAsync
    // returns Promise null if an error occurred
    async getRolesForUser( user, options, userId=null ){
        logger.warn( 'getRolesForUser() is obsoleted started with v1.9. Please use getUserRoles()' );
        return await Roles.s.getUserRoles( user, userId );
    },

    // get users in scope
    async getUsersInScope( scope, userId=null ){
        logger.warn( 'getUsersInScope() is obsoleted started with v1.10' );
        return [];
    },

    // get all roles for the user
    // returns {Object} an object with following keys:
    //   - global: the global roles as an object with following keys:
    //     > all: an array of all roles
    //     > direct: an array of direct roles
    //   - scoped: the scoped roles as an object keyed by the scope identifier, with folloging keys
    //     > all: an array of all roles for this scope
    //     > direct: an array of direct roles for this scope
    async getUserRoles( target, requester=null ){
        check( target, Match.OneOf( Match.NonEmptyString, Object ));
        check( requester, Match.OneOf( Match.NonEmptyString, Object ));
        let targetId = target;
        if( _.isObject( target )){
            targetId = target._id;
        }
        let requesterId = requester;
        if( _.isObject( requester )){
            requesterId = requester._id;
        }
        try {
            const allowed = ( targetId === requesterId ) ? true : await Roles.isAllowed( 'pwix.roles.fn.getUserRoles', requesterId, target );
            if( allowed ){
                const collectionName = Roles.configure().assignmentsCollection;
                const collection = Mongo.getCollection( collectionName );
                check( collection, Mongo.Collection );
                let targetId = target;
                if( _.isObject( target )){
                    targetId = target._id;
                }
                const fetched = await collection.find({ 'user._id': targetId }).fetchAsync();
                //logger.debug( 'fetched', fetched );
                // get something like:
                //    fetched [
                //    {
                //        _id: 'Wm64TCbu2AwjRtuDc',
                //        user: { _id: 'AtJ9dNdzumE5PkPA5' },
                //        role: { _id: 'APP_ADMINISTRATOR' },
                //        scope: null,
                //        inheritedRoles: [
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object], [Object], [Object],
                //        [Object], [Object]
                //        ]
                //    },
                //    {
                //        _id: 'ED8XMfiqMuoPgdD5j',
                //        user: { _id: 'AtJ9dNdzumE5PkPA5' },
                //        role: { _id: 'SCOPED_IDENTITIES_MANAGER' },
                //        scope: 'bDZcDsWtuqyJJAQcb',
                //        inheritedRoles: [
                //        [Object], [Object],
                //        [Object], [Object],
                //        [Object], [Object],
                //        [Object], [Object],
                //        [Object]
                //        ]
                //    }
                //  ]
                let roles = { userid: targetId, global: { direct: [], all: [] }, scoped: {}};
                for( const it of fetched ){
                    if( it.scope ){
                        roles.scoped[it.scope] = roles.scoped[it.scope] || { all: [], direct: [] };
                        Roles._doSetup( it, roles.scoped[it.scope] );
                    } else {
                        Roles._doSetup( it, roles.global );
                    }
                }
                return roles;
            }
            return null;
        }
        catch( e ){
            logger.error( 'allRolesForUser()', e );
        }
        return null;
    },

    // whether the userId has any 'scope' scoped role
    async hasScopedRole( target, scope, requester=null ){
        check( target, Match.OneOf( Match.NonEmptyString, Object ));
        check( scope, Match.NonEmptyString );
        check( requester, Match.OneOf( Match.NonEmptyString, Object ));
        let targetId = target;
        if( _.isObject( target )){
            targetId = target._id;
        }
        let requesterId = requester;
        if( _.isObject( requester )){
            requesterId = requester._id;
        }
        try {
            const allowed = ( targetId === requesterId ) ? true : await Roles.isAllowed( 'pwix.roles.fn.hasScopedRole', requesterId, target, scope );
            if( allowed ){
                const fetched = await Meteor.roleAssignment.find({ 'user._id': targetId, scope: scope }).fetchAsync();
                return fetched.length > 0;
            }
        }
        catch( e ){
            logger.error( 'hasScopedRole()', e );
        }
        return false;
    },

    // remove all roles for the user
    //  returns a Promise which resolves to true|false
    async removeAllRolesFromUser( user ){
        logger.warn( 'removeAllRolesFromUser() is obsoleted started with v1.3.2. Please use removeAssignedRolesFromUser()' );
        return await Roles.s.removeAssignedRolesFromUser( user );
    },

    // remove all roles for the user
    //  returns true|false, or null if an error occurred
    async removeAssignedRolesFromUser( target, requester=null ){
        check( target, Match.OneOf( Match.NonEmptyString, Object ));
        check( requester, Match.OneOf( Match.NonEmptyString, Object ));
        let targetId = target;
        if( _.isObject( target )){
            targetId = target._id;
        }
        let requesterId = requester;
        if( _.isObject( requester )){
            requesterId = requester._id;
        }
        try {
            const allowed = ( targetId === requesterId ) ? false : await Roles.isAllowed( 'pwix.roles.fn.removeAssignedRolesFromUser', requester, target )
            if( allowed ){
                const countDeleted = await Meteor.roleAssignment.removeAsync({ 'user._id': targetid });
                logger.debug( 'removeAssignedRolesFromUser()', target, countDeleted );
                return countDeleted !== null;
            }
        }
        catch( e ) {
            logger.error( 'removeAssignedRolesFromUser()', e );
        }
        return false;
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves an array of the result for each role
    async removeUserAssignmentsForRoles( roles, opts, userId=null ){
        logger.warn( 'removeUserAssignmentsForRoles() is obsoleted started with v1.3.2.' );
        return false;
    },

    // remove all assignments for the role(s)
    //  returns a Promise which resolves to an array of the result for each role, or null if an error occurred
    async removeUserAssignmentsFromRoles( roles, opts={}, userId=null ){
        logger.warn( 'removeUserAssignmentsFromRoles() is obsoleted started with v1.10.' );
        return false;
    },

    // reset all assignment for a scope
    // opts is an optional options object with following keys:
    // - original: the original roles assignments for this scope, which should be found unchanged
    // returns: the reason for why it has not been successful, or empty
    async resetScopedAssignments( scope, assignments, opts={}, userId=null ){
        if( !scope || !_.isString( scope )){
            logger.error( 'resetScopedAssignments() expect scope be a non-empty string, got', scope, 'throwing...' );
            throw new Error( 'Bad argument: scope' );
        }
        if( !assignments || !_.isArray( assignments )){
            logger.error( 'resetScopedAssignments() expect assignments be an array, got', assignments, 'throwing...' );
            throw new Error( 'Bad argument: assignments' );
        }
        const allowed = await Roles.isAllowed( 'pwix.roles.fn.setScopedAssignments', userId, scope );
        if( !allowed ){
            logger.debug( 'resetScopedAssignments() not allowed' );
            return pwixI18n.label( I18N, 'accounts.err_not_allowed' );
        }
        const currentAssignments = await Meteor.roleAssignment.find({ scope: scope }).fetchAsync();
        if( opts.orig ){
            // check that current assignments are same than the original - else refuses the update
            if( opts.orig.length !== currentAssignments.length ){
                logger.debug( 'resetScopedAssignments() change detected' );
                return pwixI18n.label( I18N, 'accounts.err_change_detected' );
            }
            let notfound = 0;
            currentAssignments.forEach(( it ) => {
                let found = false;
                opts.orig.every(( o ) => {
                    if( o._id === it._id ){
                        found = true;
                        return false;
                    }
                    return true;
                });
                if( !found ){
                    notfound += 1;
                }
            });
            if( notfound > 0 ){
                logger.debug( 'resetScopedAssignments() change detected' );
                return pwixI18n.label( I18N, 'accounts.err_change_detected' );
            }
        }
        // compute the assignments to be removed and to be added
        const to_add = [];
        const to_remove = [];
        assignments.forEach(( it ) => {
            let found = false;
            currentAssignments.every(( o ) => {
                if( o._id === it._id ){
                    found = true;
                    return false;
                }
                return true;
            });
            if( !found ){
                to_add.push( it );
            }
        });
        currentAssignments.forEach(( it ) => {
            let found = false;
            assignments.every(( o ) => {
                if( o._id === it._id ){
                    found = true;
                    return false;
                }
                return true;
            });
            if( !found ){
                to_remove.push( it );
            }
        });
        if( to_add.length === 0 && to_remove.length === 0 ){
            logger.log( 'no detected change' );
            return '';
        }
        logger.debug( 'resetScopedAssignments() to_add', to_add );
        logger.debug( 'resetScopedAssignments() to_remove', to_remove );
        for( const it of to_add ){
            await alRoles.addUsersToRolesAsync( it.user._id, it.role._id, { scope: scope });
        }
        for( const it of to_remove ){
            await Meteor.roleAssignment.removeAsync({ _id: it._id });
        }
        // no error reason -> success
        return '';
    },

    // replace the roles of the user
    //  return true|false, or null if an error occurred
    async setUserRoles( target, roles, requester=null ){
        check( target, Match.OneOf( Match.NonEmptyString, Object ));
        check( requester, Match.OneOf( Match.NonEmptyString, Object ));
        let targetId = target;
        if( _.isObject( target )){
            targetId = target._id;
        }
        let requesterId = requester;
        if( _.isObject( requester )){
            requesterId = requester._id;
        }
        let res = false;
        try {
            const allowed = ( targetId === requesterId ) ? false : await Roles.isAllowed( 'pwix.roles.fn.setUserRoles', requester, target, roles );
            if( allowed ){
                res = await Roles.s.removeAssignedRolesFromUser( target, requester );
                res = await alRoles.setUserRolesAsync( targetId, roles.global.direct, { anyScope: true });
                for( const it of ( Object.keys( roles.scoped || {} ))){
                    res = await alRoles.setUserRolesAsync( targetId, roles.scoped[it].direct, { scope: it });
                }
                res = await Meteor.users.rawCollection().updateOne({ _id: targetId }, { $set: {
                    updatedAt: new Date(),
                    updatedBy: requesterId
                }});
            }
        }
        catch( e ) {
            logger.error( 'setUserRoles()', e );
            return null;
        }
        return res;
    },

    // returns the list of used scopes
    async usedScopes( userId=null){
        try {
            const allowed = await Roles.isAllowed( 'pwix.roles.fn.usedScopes', userId );
            if( allowed ){
                return await Meteor.roleAssignment.rawCollection().distinct( 'scope' );
            }
        }
        catch( e ) {
            logger.error( 'usedScopes()', e );
        }
        return null;
    }
};
