/*
 * pwix:roles/src/client/js/autorun.js
 */

import { Tracker } from 'meteor/tracker';
import { Roles } from 'meteor/alanning:roles';

import '../../common/js/index.js';

// the package is said ready when the publication for the current user is ready
Tracker.autorun(() => {
    if( Roles.subscription.ready()){
        _ready.val = true,
        _ready.dep.changed();
    }
});

// update the current user roles when the logged-in status changes
Tracker.autorun(() => {
    if( pwiRoles.ready()){
        const _previous = _current.val.id;
        const id = Meteor.userId();
        if( _previous !== id ){
            const res = ( id ? Roles.getRolesForUser( id ) : [] ) || [];
            _current.val.all = res;
            _current.val.direct = pwiRoles.filter( res );
            _current.val.id = id;
            _current.dep.changed();
        }
    }
});
