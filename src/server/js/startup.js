/*
 * pwix:roles/src/server/js/startup.js
 */

// be verbose if asked for
Meteor.startup( function(){
    if( pwixRoles._conf.verbosity & PR_VERBOSE_CONFIGURE ){
        console.debug( 'pwix:roles client.startup()' );
    }
});

// on the client, pwixRoles.ready() is set when Roles.subscription is itself ready.
//  we force the package to be ready on the server at startup
Meteor.startup( function(){
    _ready.val = true,
    _ready.dep.changed();
});
