/*
 * pwix:roles/src/client/js/startup.js
 */

// be verbose if asked for
Meteor.startup( function(){
    _verbose( Roles.C.Verbose.STARTUP, 'pwix:roles client.startup()' );
});
