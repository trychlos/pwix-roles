/*
 * pwix:roles/src/server/js/maintain.js
 *
 *  It is expected that the application has configured the pwix:roles package by calling Roles.configure()
 *  with at least an object { conf: { roles: { hierarchy: [] }}}, before Meteor.startup() time.
 *  So it is time for us to define these roles here.
 * 
 *  NB: it happens that the underlying alanning:roles package doesn't care
 *  of updating the inherited roles it maintains when a new role appears here. As a consequence, users do not
 *  take advantage of these new roles (at least if we use the standard alanning:roles methods).
 * 
 *  => roles assignment must be reviewed, most probably at least completed (but see below).
 * 
 *  Same that not updating the inherited roles, the alanning:roles doesn't clean up the obsolete roles
 * 
 *  => roles should be cleaned of no more existing ids
 *      unless the to-be-cleaned role has been directly assigned to a user : logs a UPPERCASE warning!
 */

import { Roles as alRoles } from 'meteor/alanning:roles';

let rolesAllRoles = [];         // when defining new roles and when removing obsolete ones
let rolesAssignments = [];      // when completing the inheritance and when removing obsolete ones

function f_DefineNewRoles(){
    let msg = false;

    function f_msg(){
        if( !msg ){
            if( Roles._conf.verbosity & Roles.C.Verbose.MAINTAIN ){
                console.log( 'pwix:roles/src/server/js/maintain.js defining not-yet existing roles...' );
            }
            msg = true;
        }
    }

    // is the role name already defined (i.e. does it exist in rolesAllRoles) ?
    //  flag the used roles
    function f_definedRole( name ){
        let found = false;
        rolesAllRoles.every(( o ) => {
            if( o._id === name ){
                found = true;
                o.relevant = true;
                return false;
            }
            return true;
        });
        return found;
    }

    // make sure the application-defined roles are defined
    // NB: recursive async function
    function f_define( o, parent ){
        if( o.name ){
            if( f_definedRole( o.name )){
                //f_msg();
                //console.log( '   '+o.name+' already defined' );
            } else {
                f_msg();
                if( Roles._conf.verbosity & Roles.C.Verbose.MAINTAIN ){
                    console.log( '   defining '+o.name );
                }
                alRoles.createRoleAsync( o.name, { unlessExists: true })
                    .then(() => {
                        if( parent ){
                            alRoles.addRolesToParentAsync( o.name, parent );
                        }
                    })
                    .then(() => {
                        if( o.children ){
                            o.children.every(( child ) => {
                                f_define( child, o.name );
                                return true;
                            });
                        }
                    });
            }
        }
    }

    // f_DefineNewRoles() main code

    // get currently defined roles
    // each role is listed with its direct children; this is not a recursive tree
    // the used method makes sure we get as many roles as we have defined, each with its direct children
    // as objects { _id: <role_name>, children: [ array of objects { _id: <role_name> } ] }
    alRoles.getAllRoles().fetchAsync()
        .then(( fetched ) => {
            fetched.every(( o ) => {
                //console.log( 'Roles.getAllRoles', o );
                rolesAllRoles.push( o );
                return true;
            })
        });
    //console.debug( 'rolesAllRoles', rolesAllRoles );

    // iterate on our roles, defining the missing ones
    if( Roles._conf && Roles._conf.roles && Roles._conf.roles.hierarchy && Array.isArray( Roles._conf.roles.hierarchy )){
        Roles._conf.roles.hierarchy.every(( o ) => {
            f_define( o );
            return true;
        });
    }

    if( !msg ){
        if( Roles._conf.verbosity & Roles.C.Verbose.MAINTAIN ){
            console.log( 'pwix:roles/src/server/js/maintain.js defined roles all exist: fine.' );
        }
    }
}

function f_InheritanceCompleteness(){

    // returns the full list of roles inherited from this one, including this one
    //  the reference being the configured roles hierarchy
    function f_inherited( name ){
        let result = [];

        function f_children( array, role, found ){
            //console.log( 'role', role );
            array.every(( o ) => {
                if( o.name === role ){
                    result.push({ _id: o.name });
                    if( o.children ){
                        f_children( o.children, role, true );
                    }
                    return false;
                }
                //console.log( o );
                if( found ){
                    result.push({ _id: o.name });
                }
                if( o.children ){
                    f_children( o.children, role, found );
                }
                return true;
            });
        }

        if( Roles._conf.roles && Roles._conf.roles.hierarchy ){
            f_children( Roles._conf.roles.hierarchy, name, false );
        } else {
            result.push({ _id: name });
        }
        return result;        
    }

    // returns an array of just the _id (the names)
    function f_ids( array ){
        let res = [];
        array.every(( o ) => {
            res.push( o._id );
            return true;
        });
        return res;
    }

    // compare the inherited roles found in the roleAssignment collection with the computed ones
    //  https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
    function f_compare( computed, collection ){
        if( computed.length !== collection.length ){
            return false;
        }
        let ok = true;
        const collectionNames = f_ids( collection );
        for( let i=0 ; i<computed.length ; ++i ){
            if( !collectionNames.includes( computed[i]._id )){
                //console.log( 'i='+i, computed[i] );
                ok = false;
                break;
            }
        }
        return ok;
    }

    // maintain the roles assignment completeness - make sure the inherited roles are complete
    let msg = false;
    Meteor.roleAssignment.find().fetchAsync()
        .then(( fetched ) => {
            fetched.every(( o ) => {
                //console.log( o );
                const inherited = f_inherited( o.role._id );
                const equals = f_compare( inherited, o.inheritedRoles );
                //console.log( o.role._id, inherited, typeof inherited, inherited.length, o.inheritedRoles, typeof o.inheritedRoles, o.inheritedRoles.length, equals );
                if( !equals ){
                    if( !msg ){
                        if( Roles._conf.verbosity & Roles.C.Verbose.MAINTAIN ){
                            console.log( 'pwix:roles/src/server/js/maintain.js maintaining the roles inheritage completeness...' );
                        }
                        msg = true;
                    }
                    if( Roles._conf.verbosity & Roles.C.Verbose.MAINTAIN ){
                        console.log( '   updating id='+o._id, o.role._id, 'user='+o.user._id );
                    }
                    Meteor.roleAssignment.updateAsync({ _id: o._id }, { $set: { inheritedRoles: inherited }});
                    o.inheritedRoles = [ ...inherited ];
                }
                rolesAssignments.push( o );
                return true;
            })
        });
    if( !msg ){
        if( Roles._conf.verbosity & Roles.C.Verbose.MAINTAIN ){
            console.log( 'pwix:roles/src/server/js/maintain.js roles inheritance is complete: fine.' );
        }
    }
}

// make sure we do not keep obsolete AND unused roles
//  obsolete but still used roles must first be de-assign before being removed
function f_CleanupObsoleteRoles(){
}

Meteor.startup( function(){
    if( Roles._conf.maintainHierarchy ){
        f_DefineNewRoles();
        f_InheritanceCompleteness();
        f_CleanupObsoleteRoles();
    }
});
