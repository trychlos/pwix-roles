/*
 * pwix:roles/src/client/js/startup.js
 */

// be verbose if asked for
Meteor.startup( function(){
    if( pwixRoles._conf.verbosity & pwixRoles.C.Verbose.CONFIGURE ){
        console.debug( 'pwix:roles client.startup()' );
    }
});
