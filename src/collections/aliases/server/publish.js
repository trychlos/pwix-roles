
import { rolesAliases } from '../aliases.js';

// returns the list of known contents
Meteor.publish( 'pwixRoles.Aliases.listAl', function(){
    return rolesAliases.find();
});
