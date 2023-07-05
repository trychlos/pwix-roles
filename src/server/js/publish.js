/*
 * pwix:roles/src/server/js/publish.js
 */

import { Roles } from 'meteor/alanning:roles';

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
Meteor.publish( 'pwixRoles.allAssignments', function(){
    return Meteor.roleAssignment.find();
});

// publishes the count of users which have a role
//  as several roles may be asked, this publication provides a 'CountByRole' collection, with one row { role, count } per role
//
// Roles.getUsersInRole() provides records as ( user_id, user_doc ), where user_doc contains:
// [Arguments] {
//       '0': 'hy8xnHQj2bujPa7Cr',
//       '1': {
//         createdAt: 2023-07-06T06:29:16.277Z,
//         services: { password: [Object], resume: [Object], email: [Object] },
//         emails: [ [Object] ]
//       }
//     }
//
Meteor.publish( 'pwixRoles.countByRole', function( roles ){

    const self = this;
    const collectionName = 'CountByRole';
    const rolesArray = Array.isArray( roles ) ? roles : [ roles ];
    let collectionHash = {};

    // `observeChanges` only returns after the initial `added` callbacks have run.
    // Until then, we don't want to send a lot of `changed` messages—hence
    // tracking the `initializing` state.

    const handle = Roles.getUsersInRole( rolesArray ).observeChanges({
        added( user_id, user_doc ){
            //console.debug( arguments );
            const userRoles = Roles.getRolesForUser( user_id );
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
        }
        // cannot handle changed() nor removed() as obviously the roles have changed or have been removed
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
