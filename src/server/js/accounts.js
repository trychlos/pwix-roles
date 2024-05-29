/*
 * pwix:roles/src/server/js/accounts.js
 */

Meteor.methods({
    // returns the requested user
    'Roles.Accounts.User'( id ){
        return Meteor.users.findOneAsync({ _id: id });
    },

    // update updatedAt / updatedBy when updating the user's roles
    'Roles.Accounts.Updated'( id ){
        return Meteor.users.updateAsync({ _id: id }, { $set: {
            updatedAt: new Date(),
            updatedBy: Meteor.userId()
        }});
    }
});
