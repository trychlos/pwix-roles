/*
 * pwix:roles/src/server/js/publish.js
 */

import { Roles as alRoles } from 'meteor/alanning:roles';

// publishes the roles of the specified user (or of all users)
//  requires at least a connected user
Meteor.publish( 'pwix_roles_user_assignments', async function( user=null ){
    const allowed = await Roles.isAllowed( 'pwix.roles.pub.user_assignments', this.userId, user );
    if( allowed ){
        let selector = {};
        if( user ){
            selector['user._id'] = user._id || user;
        }
        return Meteor.roleAssignment.find( selector );
    }
    this.ready();
    return false;
});

// publishes the used scopes
//  this acts as a default if the application doesn't provide its own list of managed scopes
//  requires at least a connected user

const pwix_roles_used_scopes_pub = function( self ){
    const collectionName = 'pwix_roles_used_scopes';
    let scopes = {};

    // `observeChanges` only returns after the initial `added` callbacks have run.
    // Until then, we don't want to send a lot of `changed` messages
    // hence tracking the `initializing` state.
    let initializing = true;

    const observer = Meteor.roleAssignment.find({ scope: { $ne: null }}).observeChangesAsync({
        added( item ){
            scopes[item.scope] = scopes[item.scope] || 0;
            scopes[item.scope] += 1;
            if( scopes[item.scope] === 1 ){
                self.added( collectionName, item.scope );
            }
        },
        removed( oldItem ){
            scopes[oldItem.scope] -= 1;
            if( !scopes[oldItem.scope] ){
                self.removed( collectionName, scopes[oldItem.scope] );
            }
        }
    });

    initializing = false;

    self.ready();

    self.onStop( function(){
        observer.then(( handle ) => { handle.stop(); });
    });
};

Meteor.publish( 'pwix_roles_used_scopes', async function(){
    const allowed = await Roles.isAllowed( 'pwix.roles.pub.used_scopes', this.userId );
    if( allowed ){
        pwix_roles_used_scopes_pub( this );
    }
    //console.log( 'pwix.roles.pub.used_scopes not allowed', this.userId );
    this.ready();
    return false;
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

// keys are roles (name/id)
// values are arrays of user._id
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
            const array = _rolesHash[role._id];
            array.push( user_id );
            _rolesHash[role._id] = [ ...new Set( array )];
            return true;
        });
    }

    const roleHandle = Meteor.roleAssignment.find({}).observeAsync({
        added( doc ){
            //console.debug( 'roleAssignment added', arguments );
            //_remove( doc.user._id );
            if( doc.inheritedRoles ){
                _set( doc.user._id, doc.inheritedRoles );
            }
            cb();
        },
        changed( newDoc, oldDoc ){
            //console.debug( 'roleAssignment changed', arguments );
            //_remove( newDoc.user._id );
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

    const userHandle = Meteor.users.find({}).observeAsync({
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

// publishes the count of users which have a role, either direct or inherited
//  as several roles may be asked, this publication provides a 'pwix_roles_count_by_roles' collection, with one row { role, count } per role
//  this is used by pwix:startup-app-admin, so when there is not yet any connected user -> so we cannot protect that and this is public
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
Meteor.publish( 'pwix_roles_count_by_roles', async function( roles ){
    // maybe the application may protect that
    if( !await Roles.isAllowed( 'pwix.roles.pub.count_by_roles', this.userId, roles )){
        //console.log( 'pwix.roles.pub.count_by_roles not allowed', this.userId );
        this.ready();
        return false;
    }

    //console.debug( 'pwix_roles_count_by_roles', roles );
    const self = this;
    const collectionName = 'pwix_roles_count_by_roles';
    const rolesArray = Array.isArray( roles ) ? roles : [ roles ];
    let initialized = false;
    let first = true;

    // this callback re-publish the whole set on each modification
    //  this provides to the client rows something as: { _id: 'APP_ADMIN', role: 'APP_ADMIN', count: 1 }

    const _publish = function(){
        if( initialized ){
            //console.debug( '_publish', _rolesHash );
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
    // subscription automatically takes care of sending the client any `removed` messages.
    this.onStop(() => {
        handles.forEach(( h ) => { h.then(( res ) => { res.stop(); }); });
    });
});

// publishes the list of users which have a role inside of a given scope
Meteor.publish( 'pwix_roles_list_by_scope', function( scope ){
    return Meteor.roleAssignment.find({ scope: scope });
});
