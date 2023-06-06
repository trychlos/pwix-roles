/*
 * pwix:roles/src/client/js/startup.js
 */

// be verbose if asked for
Meteor.startup( function(){
    if( pwixRoles._conf.verbosity & PR_VERBOSE_CONFIGURE ){
        console.debug( 'pwix:roles client.startup()' );
    }
});
