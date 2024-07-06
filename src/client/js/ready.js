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

// the underlying 'alanning:roles' package is said ready when the publication for the current user is ready
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
    _verbose( Roles.C.Verbose.READY, 'Roles.ready()', Roles.ready());
});
