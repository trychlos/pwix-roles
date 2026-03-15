/*
 * pwix:roles/src/client/js/ready.js
 */

import { Logger } from 'meteor/pwix:logger';
import { Tracker } from 'meteor/tracker';

const logger = Logger.get();

// client only
_ready = {
    handle: null,
    dep: new Tracker.Dependency(),
    val: false
};

// with v4.0.0, alanning:roles no more automatically publishes the roles for the connected user - Have to replace this feature
//alRoles.subscription = Meteor.subscribe( 'pwix.Roles.p.userAssignments_roles', Meteor.userId());
_ready.handle = Meteor.subscribe( 'pwix.Roles.p.userAssignments', Meteor.userId());

// when we have got the roles of the current user
Tracker.autorun(() => {
    if( _ready.handle.ready()){
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
    logger.verbose({ verbosity: Roles.configure().verbosity, against: Roles.C.Verbose.READY }, 'ready()', Roles.ready());
});
