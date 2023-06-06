/*
 * pwix:roles/src/client/js/autorun.js
 */

import { Tracker } from 'meteor/tracker';
import { Roles } from 'meteor/alanning:roles';

// only available on the client
_current = {
    dep: new Tracker.Dependency(),
    val: {
        id: '',
        all: [],
        direct: []
    }
};

// update the current user roles when the logged-in status changes
//  client only as Meteor.userId() doesn't has any sense on the server
Tracker.autorun(() => {
    if( pwixRoles.ready()){
        const _previous = _current.val.id;
        const id = Meteor.userId();
        if( _previous !== id ){
            console.log( 'pwix:roles set roles for current user' );
            const res = ( id ? Roles.getRolesForUser( id ) : [] ) || [];
            _current.val.all = res;
            _current.val.direct = pwixRoles.filter( res );
            _current.val.id = id;
            _current.dep.changed();
        }
    }
});
