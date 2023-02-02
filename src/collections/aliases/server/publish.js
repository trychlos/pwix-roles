
import { rolesAliases } from '../aliases.js';

// returns the list of known contents
Meteor.publish( 'pwiRoles.Aliases.listAl', function(){
    return rolesAliases.find();
});
