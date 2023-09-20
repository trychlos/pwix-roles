
import { rolesAliases } from '../aliases.js';

Meteor.methods({
    /*
    // empty the collection
    'Roles.Aliases.empty'(){
        return rolesAliases.remove({});
    },

    // get some content from the database
    'content.get'( name ){
        return Contents.findOne({ name: name }) || {};
    },

    // import an element (so do not modify any data) 
    'content.import'( elt ){
        return Contents.insert( elt );
    },
    **/

    /*
    // add an alias declaration in the database
    'Roles.Aliases.insert'( name, content ){
        let orig = Contents.findOne({ name: name });
        //console.log( 'content.set orig=', orig );
        let o = {
            content: content
        };
        if( orig ){
            //console.log( 'content.set setting updatedAt' );
            o.updatedAt = new Date();
        } else {
            //console.log( 'content.set setting createdAt' );
            o.createdAt = new Date();
        }
        return rolesAliases.upsert({ name: name }, { $set: o });
    }
    */
});
