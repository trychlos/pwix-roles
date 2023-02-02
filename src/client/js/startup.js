/*
 * pwix:roles/src/client/js/startup.js
 */

if( Meteor.isClient ){
    Meteor.startup( function(){
        console.log( 'pwix:roles/src/client/js/startup.js Meteor.startup()', pwiRoles );
    });
}
