/*
 * pwix:roles/src/common/js/startup.js
 */

import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

// be verbose if asked for
Meteor.startup( function(){
    logger.verbose({ verbosity: Roles.configure().verbosity, against: Roles.C.Verbose.STARTUP }, 'common startup()' );
});
