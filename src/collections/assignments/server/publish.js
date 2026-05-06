/*
 * pwix:roles/src/common/collections/assignments/server/publish.js
 */

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';
import { Mongo } from 'meteor/mongo';

import { Assignments } from '../index.js';

// publishes the list of user ids which have a manager role
//  manager roles can be identified either as a global role, or a scope role
//  we so publish all these owners of the given roles, whatever be the scope
//
// opts is an optional options object with following keys:
//  - scope: the desired scope, defaulting to none (searching for a global role)
//  - scopedOnly: whether to only search for a scoped role, defaulting to false
//  - anyScope: whether to search for both global and scoped roles, defaulting to false
Meteor.publish( 'pwix.Roles.p.Assignments.roles', function( roles, opts={} ){
    const collectionName = Roles.configure().assignmentsCollection;
    const collection = Mongo.getCollection( collectionName );
    check( collection, Mongo.Collection );
    const rolesCondition = {
        $or: [
            { 'role._id': { $in: roles }},
            { 'inheritedRoles._id': { $in: roles }},    // true if any of inherited matches any of roles
        ]
    };
    let scopeCondition = { $or: [] };
    if( opts.scope ){
        scopeCondition.$or.push({ scope: opts.scope });
    }
    if( opts.scopedOnly !== true ){
        scopeCondition.$or.push({ scope: { $exists: false }});
    }
    // if anyScope is true, then just empty the scope condition
    if( opts.anyScope === true ){
        scopeCondition = {};
    }
    const selector = {
        $and: [
            scopeCondition || { $expr: true },
            rolesCondition || { $expr: true },
        ]
    };
    return collection.find( selector );
});
