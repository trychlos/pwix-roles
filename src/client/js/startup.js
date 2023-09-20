/*
 * pwix:roles/src/client/js/startup.js
 */

// be verbose if asked for
Meteor.startup( function(){
    if( Roles._conf.verbosity & Roles.C.Verbose.CONFIGURE ){
        console.debug( 'pwix:roles client.startup()' );
    }
});
