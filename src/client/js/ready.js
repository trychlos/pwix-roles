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

// the underlying 'alanning:roles' package is said ready when all existing roles are available on the client side
//  https://meteor-community-packages.github.io/meteor-roles/classes/Roles.html#property_subscription
Tracker.autorun(() => {
    if( alRoles.subscription.ready()){
        //console.debug( 'setting ready to true' );
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
