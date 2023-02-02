/*
 * pwix:roles/src/collections/aliases/aliases.js
 */
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export const rolesAliases = new Mongo.Collection( 'role-aliases' );

rolesAliases.fn = {};

rolesAliases.schema = new SimpleSchema({
    // list of aliases
    aliases: {
        type: Array,
        defaultValue: []
    },
    "aliases.$": String,

    // Mongo identifier
    // mandatory (auto by Meteor+Mongo)
    _id: {
        type: String,
        optional: true
    },
    xxxxxx: {   // unused key to be sure we always have something to unset
        type: String,
        optional: true
    }
});

rolesAliases.attachSchema( rolesAliases.schema );
