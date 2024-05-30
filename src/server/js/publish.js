/*
 * pwix:roles/src/server/js/publish.js
 */

import { Roles as alRoles } from 'meteor/alanning:roles';

// publishes the roles of the current user
//  because it is not named, this publication is automatic (auto-publication)
//  the package becomes ready when this publication itself is ready
//  see https://atmospherejs.com/alanning/roles#installing
Meteor.publish( null, function(){
    if( this.userId ){
        return Meteor.roleAssignment.find({ 'user._id': this.userId });
    } else {
        this.ready()
    }
});

// publishes all the roles
//  this may be needed by an application which would wish do some sort of user's roles management
Meteor.publish( 'Roles.allAssignments', function(){
    return Meteor.roleAssignment.find();
});

// this function builds and maintains the _rolesHash has with roles -> array of users
// it returns an array of the two observer Promise handles
//
// as a reminder, roleAssignment maintains couples ( top_role, user_id ):
// db['role-assignment'].find()
// { "_id" : "mFhn5AKAJ95RiedZM", "role" : { "_id" : "APP_ADMINISTRATOR" }, "scope" : null, "user" : { "_id" : "EqvmJAhNAZTBAECya" }, "inheritedRoles" : [ { "_id" : "APP_ADMINISTRATOR" }, { "_id" : "APP_WRITER" }, { "_id" : "APP_ADM_WRITER" }, { "_id" : "APP_BANDA_WRITER" }, { "_id" : "APP_DECOUVERTE_WRITER" }, { "_id" : "APP_EVEIL_WRITER" }, { "_id" : "APP_HOME_WRITER" }, { "_id" : "APP_MAIL_WRITER" }, { "_id" : "APP_NEWS_MANAGER" }, { "_id" : "APP_NEWS_WRITER" }, { "_id" : "APP_CONTENT_MANAGER" }, { "_id" : "APP_SUBSCRIPTIONS_MANAGER" }, { "_id" : "APP_USER_MANAGER" }, { "_id" : "APP_FORUMS_MANAGER" }, { "_id" : "FRS_ADMIN" }, { "_id" : "FRS_CATEGORY_MANAGER" }, { "_id" : "FRS_CATEGORY_CREATE" }, { "_id" : "FRS_CATEGORY_UPDATE" }, { "_id" : "FRS_CATEGORY_DELETE" }, { "_id" : "FRS_FORUM_MANAGER" }, { "_id" : "FRS_FORUM_CREATE" }, { "_id" : "FRS_FORUM_UPDATE" }, { "_id" : "FRS_FORUM_DELETE" }, { "_id" : "FRS_MODERATOR_MANAGER" }, { "_id" : "FRS_MODERATOR" }, { "_id" : "FRS_PUBLIC_MODERATOR" }, { "_id" : "FRS_PRIVATE_MODERATOR" }, { "_id" : "FRS_MODERATOR_ACCESS" }, { "_id" : "FRS_PRIVATE_EDIT" }, { "_id" : "FRS_PRIVATE_VIEW" }, { "_id" : "GROUP_ACCORD_BUREAU" }, { "_id" : "GROUP_ACCORD_MEMBRE" }, { "_id" : "GROUP_BANDACCORD" }, { "_id" : "GROUP_EVEIL" }, { "_id" : "GROUP_DECOUVERTE" } ] }
// { "_id" : "uuAmYfTWzLKuzrKb6", "role" : { "_id" : "APP_WRITER" }, "scope" : null, "user" : { "_id" : "uaxdN48P9bZdBCgEk" }, "inheritedRoles" : [ { "_id" : "APP_WRITER" }, { "_id" : "APP_ADM_WRITER" }, { "_id" : "APP_BANDA_WRITER" }, { "_id" : "APP_DECOUVERTE_WRITER" }, { "_id" : "APP_EVEIL_WRITER" }, { "_id" : "APP_HOME_WRITER" }, { "_id" : "APP_MAIL_WRITER" } ] }
// { "_id" : "P4h5ZnrFXfJfPtSjL", "role" : { "_id" : "APP_NEWS_MANAGER" }, "scope" : null, "user" : { "_id" : "uaxdN48P9bZdBCgEk" }, "inheritedRoles" : [ { "_id" : "APP_NEWS_MANAGER" }, { "_id" : "APP_NEWS_WRITER" } ] }
// { "_id" : "F3jJj2hHZ2MD6533e", "role" : { "_id" : "APP_CONTENT_MANAGER" }, "scope" : null, "user" : { "_id" : "uaxdN48P9bZdBCgEk" }, "inheritedRoles" : [ { "_id" : "APP_CONTENT_MANAGER" } ] }
// { "_id" : "qgawoThcJe6xD3NqT", "role" : { "_id" : "APP_USER_MANAGER" }, "scope" : null, "user" : { "_id" : "uaxdN48P9bZdBCgEk" }, "inheritedRoles" : [ { "_id" : "APP_USER_MANAGER" } ] }
// { "_id" : "F6KBD2WXzw4yhAd2Y", "role" : { "_id" : "GROUP_ACCORD_BUREAU" }, "scope" : null, "user" : { "_id" : "uaxdN48P9bZdBCgEk" }, "inheritedRoles" : [ { "_id" : "GROUP_ACCORD_BUREAU" }, { "_id" : "GROUP_ACCORD_MEMBRE" } ] }
// { "_id" : "6PfeMDnGZjiy24DNo", "role" : { "_id" : "GROUP_BANDACCORD" }, "scope" : null, "user" : { "_id" : "uaxdN48P9bZdBCgEk" }, "inheritedRoles" : [ { "_id" : "GROUP_BANDACCORD" } ] }
// { "_id" : "xSoRCZnxEw7dCzuD5", "role" : { "_id" : "GROUP_EVEIL" }, "scope" : null, "user" : { "_id" : "uaxdN48P9bZdBCgEk" }, "inheritedRoles" : [ { "_id" : "GROUP_EVEIL" } ] }
// { "_id" : "kEY8Qq2LHFwjiyQY7", "role" : { "_id" : "GROUP_DECOUVERTE" }, "scope" : null, "user" : { "_id" : "uaxdN48P9bZdBCgEk" }, "inheritedRoles" : [ { "_id" : "GROUP_DECOUVERTE" } ] }
// { "_id" : "dpkTg4HosoyXRsYS2", "role" : { "_id" : "GROUP_ACCORD_MEMBRE" }, "scope" : null, "user" : { "_id" : "55QDvyxocA8XBnyTy" }, "inheritedRoles" : [ { "_id" : "GROUP_ACCORD_MEMBRE" } ] }
// { "_id" : "sJQNPpYwXPt8bsCWu", "role" : { "_id" : "GROUP_EVEIL" }, "scope" : null, "user" : { "_id" : "55QDvyxocA8XBnyTy" }, "inheritedRoles" : [ { "_id" : "GROUP_EVEIL" } ] }
// { "_id" : "muw4F8sxuaC84xwEb", "role" : { "_id" : "APP_ADMINISTRATOR" }, "scope" : null, "user" : { "_id" : "yoMKz2WLkw4w4dKzb" }, "inheritedRoles" : [ { "_id" : "APP_ADMINISTRATOR" }, { "_id" : "APP_CONTENT_MANAGER" }, { "_id" : "APP_FORUMS_MANAGER" }, { "_id" : "APP_NEWS_MANAGER" }, { "_id" : "APP_SUBSCRIPTIONS_MANAGER" }, { "_id" : "APP_USER_MANAGER" }, { "_id" : "APP_WRITER" }, { "_id" : "FRS_ADMIN" }, { "_id" : "GROUP_ACCORD_BUREAU" }, { "_id" : "GROUP_BANDACCORD" }, { "_id" : "GROUP_DECOUVERTE" }, { "_id" : "GROUP_EVEIL" }, { "_id" : "APP_NEWS_WRITER" }, { "_id" : "APP_ADM_WRITER" }, { "_id" : "APP_BANDA_WRITER" }, { "_id" : "APP_DECOUVERTE_WRITER" }, { "_id" : "APP_EVEIL_WRITER" }, { "_id" : "APP_HOME_WRITER" }, { "_id" : "APP_MAIL_WRITER" }, { "_id" : "FRS_CATEGORY_MANAGER" }, { "_id" : "FRS_FORUM_MANAGER" }, { "_id" : "FRS_MODERATORS" }, { "_id" : "FRS_MODERATOR_MANAGER" }, { "_id" : "FRS_PRIVATE_EDIT" }, { "_id" : "GROUP_ACCORD_MEMBRE" }, { "_id" : "FRS_CATEGORY_CREATE" }, { "_id" : "FRS_CATEGORY_DELETE" }, { "_id" : "FRS_CATEGORY_UPDATE" }, { "_id" : "FRS_FORUM_CREATE" }, { "_id" : "FRS_FORUM_DELETE" }, { "_id" : "FRS_FORUM_UPDATE" }, { "_id" : "FRS_MODERATOR" }, { "_id" : "FRS_MODERATOR_ACCESS" }, { "_id" : "FRS_PRIVATE_VIEW" }, { "_id" : "FRS_PRIVATE_MODERATOR" }, { "_id" : "FRS_PUBLIC_MODERATOR" }, { "_id" : "FRS_MODERATOR_OP" } ] }

let _rolesHash = {};

function _maintainUsersPerRole( cb ){

    const self = this;

    // remove a user from the list of roles
    const _remove = function( user_id ){
        Object.keys( _rolesHash ).every(( role ) => {
            const index = _rolesHash[role].indexOf( user_id );
            if( index > -1 ){
                _rolesHash[role].splice( index, 1 );
            }
            return true;
        });
    }

    // set a list of roles to this user
    const _set = function( user_id, inherited ){
        inherited.every(( role ) => {
            if( !Object.keys( _rolesHash ).includes( role._id )){
                _rolesHash[role._id] = [];
            }
            _rolesHash[role._id].push( user_id );
            return true;
        });
    }

    const roleHandle = Meteor.roleAssignment.find({}).observe({
        added( doc ){
            //console.debug( 'roleAssignment added', arguments );
            _remove( doc.user._id );
            if( doc.inheritedRoles ){
                _set( doc.user._id, doc.inheritedRoles );
            }
            cb();
        },
        changed( newDoc, oldDoc ){
            //console.debug( 'roleAssignment changed', arguments );
            _remove( newDoc.user._id );
            if( newDoc.inheritedRoles ){
                _set( newDoc.user._id, newDoc.inheritedRoles );
            }
            cb();
        },
        removed( doc ){
            //console.debug( 'roleAssignment removed', arguments );
            // roleAssignment removed [Arguments] { '0': 'R5uZPzretL5hF2diB' }
            _remove( doc.user._id );
            cb();
        }
    });

    const userHandle = Meteor.users.find({}).observe({
        // adding or modfying something in users collection is not relevant here
        added( user ){
        },
        changed( newUser, oldUser ){
        },
        // when removing a user, remove it from all recorded roles
        removed( user ){
            //console.debug( 'users removed', user );
            _remove( user._id );
            cb();
        }
    });

    return [ roleHandle, userHandle ];
}

// publishes the count of users which have a role
//  as several roles may be asked, this publication provides a 'CountByRole' collection, with one row { role, count } per role
//
// Roles.getUsersInRole() provides records as ( user_id, user_doc ):
// [Arguments] {
//       '0': 'hy8xnHQj2bujPa7Cr',
//       '1': {
//         createdAt: 2023-07-06T06:29:16.277Z,
//         services: { password: [Object], resume: [Object], email: [Object] },
//         emails: [ [Object] ]
//       }
//     }
//
Meteor.publish( 'Roles.countByRole', function( roles ){

    const self = this;
    const collectionName = 'CountByRole';
    const rolesArray = Array.isArray( roles ) ? roles : [ roles ];
    let initialized = false;
    let first = true;

    // this callback republish the whole set on each modification
    //  this provides to the client rows something as: { _id: 'APP_ADMIN', role: 'APP_ADMIN', count: 1 }

    const _publish = function(){
        if( initialized ){
            Object.keys( _rolesHash ).every(( role ) => {
                if( rolesArray.includes( role )){
                    if( first ){
                        self.added( collectionName, role, { role: role, count: _rolesHash[role].length });
                        //console.debug( 'publish cb adding', { role: role, count: _rolesHash[role].length });
                    } else {
                        self.changed( collectionName, role, { role: role, count: _rolesHash[role].length });
                        //console.debug( 'publish cb changing', { role: role, count: _rolesHash[role].length });
                    }
                }
                return true;
            });
            rolesArray.every(( role ) => {
                if( !Object.keys( _rolesHash ).includes( role )){
                    if( first ){
                        self.added( collectionName, role, { role: role, count: 0 });
                        //console.debug( 'publish cb adding', { role: role, count: 0 });
                    } else {
                        self.changed( collectionName, role, { role: role, count: 0 });
                        //console.debug( 'publish cb changing', { role: role, count: 0 });
                    }
                }
                return true;
            });
            first = false;
        }
    }

    const handles = _maintainUsersPerRole.bind( this )( _publish );
    initialized = true;
    _publish();

    this.ready();

    // Stop observing the cursor when the client unsubscribes. Stopping a
    // subscription automatically takes care of sending the client any `removed`
    // messages.
    this.onStop(() => {
        handles.every(( h ) => {
            h.then(( res ) => { res.stop(); });
            return true;
        })
    });
});

// publishes the list of users which have a role
//  as several roles may be asked, this publication provides a 'ListByRole' collection, with one row { role, user_id } per role and user
//  Note that this publication shares most of its code with 'Roles.countByRole' publication
//
// Rationale: it seems that Roles.getUsersInRole() publishes a non-reactive cursor, as doesn't trigger neither added(), changed() nor removed()
//  when updating the role-assignment collection.
//  However, the removed() is triggered when we delete a user from db.users collection...
//  So, we observe changes on both the two collections
Meteor.publish( 'Roles.listByRole', function( roles ){

    // return ( pwiForums.server.fn.Posts.moderablesByQuery.bind( this ))( query );

    const self = this;
    const collectionName = 'ListByRole';
    const rolesArray = Array.isArray( roles ) ? roles : [ roles ];
    let collectionHash = {};

    // `observeChanges` only returns after the initial `added` callbacks have run.
    // Until then, we don't want to send a lot of `changed` messages
    // hence tracking the `initializing` state.

    const handle = alRoles.getUsersInRoleAsync( rolesArray ).observeChanges({
        added( user_id, user_doc ){
            //console.debug( 'added', arguments );
            alRoles.getRolesForUserAsync( user_id )
                .then(( userRoles ) => {
                    rolesArray.every(( role ) => {
                        if( userRoles.includes( role )){
                            if( Object.keys( collectionHash ).includes( role )){
                                collectionHash[role] += 1;
                            } else {
                                collectionHash[role] = 1;
                            }
                        }
                        return true;
                    });
                });
        },
        // cannot handle changed() nor removed() as obviously the roles have changed or have been removed
        changed(){
            console.debug( 'changed', arguments );
        },
        removed( user_id ){
            console.debug( 'removed', arguments );
        }
    });

    // Instead, we'll send one `added` message right after `observeChanges` has
    // returned, and mark the subscription as ready.
    Object.keys( collectionHash ).every(( role ) => {
        self.added( collectionName, role, { role: role, count: collectionHash[role] });
        //console.debug( 'adding', { role: role, count: collectionHash[role] });
        return true;
    });
    rolesArray.every(( role ) => {
        if( !Object.keys( collectionHash ).includes( role )){
            self.added( collectionName, role, { role: role, count: 0 });
            //console.debug( 'adding', { role: role, count: 0 });
            //  this provides to the client rows as: { _id: 'APP_ADMIN', role: 'APP_ADMIN', count: 1 }

        }
        return true;
    });

    this.ready();

    // Stop observing the cursor when the client unsubscribes. Stopping a
    // subscription automatically takes care of sending the client any `removed`
    // messages.
    this.onStop(() => handle.stop());
});
