/*
 * pwix:roles/src/server/js/accounts.js
 */

Meteor.methods({
    // returns the requested user
    'pwixRoles.Accounts.User'( id ){
        return Meteor.users.findOne({ _id: id });
    },

    // update updatedAt / updatedBy when updating the user's roles
    'pwixRoles.Accounts.Updated'( id ){
        Meteor.users.update({ _id: id }, { $set: {
            updatedAt: new Date(),
            updatedBy: Meteor.userId()
        }});
    }
});
