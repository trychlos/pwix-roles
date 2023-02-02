/*
 * pwix:roles/src/server/js/publish.js
 */

// publishes the roles of the current user
//  because it is not named, this publication is automatic (auto-publication)
//  the package becomes ready when this publication itself is ready
//  see https://atmospherejs.com/alanning/roles#installing
Meteor.publish( null, function(){
    if( this.userId ){
        return Meteor.roleAssignment.find({ 'user._id': this.userId });
    } else {
        this.ready()
    }
});

// publishes all the roles
//  this may be needed by an application which would wish do some sort of user's roles management
Meteor.publish( 'pwiRoles.allAssignments', function(){
    return Meteor.roleAssignment.find();
});
