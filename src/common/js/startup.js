/*
 * pwix:roles/src/common/js/startup.js
 */

// be verbose if asked for
Meteor.startup( function(){
    if( Roles.configure().verbosity & Roles.C.Verbose.CONFIGURE ){
        console.debug( 'pwix:roles common.startup()', Roles );
    }
});
