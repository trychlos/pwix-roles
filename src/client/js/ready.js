/*
 * pwix:roles/src/client/js/ready.js
 */

import { Roles as alRoles } from 'meteor/alanning:roles';
import { Tracker } from 'meteor/tracker';

// client only
_ready = {
    dep: new Tracker.Dependency(),
    val: false
};

// with v4.0.0, alanning:roles no more automatically publishes the roles for the connected user - Have to replace this feature
alRoles.subscription = Meteor.subscribe( 'pwix_roles_user_assignments_roles', Meteor.userId());

// when we have got the roles of the current user
Tracker.autorun(() => {
    if( alRoles.subscription.ready()){
        _ready.val = true,
        _ready.dep.changed();
    }
});

/**
 * @summary A reactive data source
 * @locus Client
 * @returns {Boolean} true when the package is ready
 */
Roles.ready = function(){
    _ready.dep.depend();
    return _ready.val;
};

// trace changes
Tracker.autorun(() => {
    _verbose( Roles.C.Verbose.READY, 'pwix:roles ready()', Roles.ready());
});
