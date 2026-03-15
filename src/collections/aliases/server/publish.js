
import { rolesAliases } from '../aliases.js';

// returns the list of known contents
Meteor.publish( 'pwix.Roles.p.Aliases.listAll', function(){
    return rolesAliases.find();
});
