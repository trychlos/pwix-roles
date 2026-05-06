/*
 * pwix:roles/src/common/collections/assignments/server/deny.js
 */

import { Tracker } from 'meteor/tracker';

import { Assignments } from '../index.js';

// Deny all client-side updates
// cf. https://guide.meteor.com/security.html#allow-deny

Tracker.autorun(() => {
    const collectionName = Roles.configure().assignmentsCollection;
    const collection = Mongo.getCollection( collectionName );
    check( collection, Mongo.Collection );
    collection.deny({
        insert(){ return true; },
        update(){ return true; },
        remove(){ return true; },
    });
});
