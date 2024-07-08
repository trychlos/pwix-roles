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

async function f_DefineNewRoles(){
    let msg = false;

    function f_msg(){
        if( !msg ){
            _verbose( Roles.C.Verbose.MAINTAIN, 'pwix:roles/src/server/js/maintain.js defining not-yet existing roles...' );
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
            }
            return !found;
        });
        return found;
    }

    // make sure the application-defined roles are defined
    // NB: even if this is an async function, it is recursive and because we need to define parent before being able to define children
    //  we want to run all the stuff in synchronous mode -> so await
    async function f_define( o, parent ){
        if( o.name ){
            if( f_definedRole( o.name )){
                _verbose( Roles.C.Verbose.MAINTAIN, '   '+o.name+' already defined' );
            } else {
                _verbose( Roles.C.Verbose.MAINTAIN, '   defining '+o.name );
                await alRoles.createRoleAsync( o.name, { unlessExists: true });
                if( parent ){
                    await alRoles.addRolesToParentAsync( o.name, parent );
                }
            }
            if( o.children ){
                await Promise.allSettled( o.children.map( async ( child ) => {
                    await f_define( child, o.name );
                }));
            }
        }
    }

    /*
     * f_DefineNewRoles() main code
     */

    _verbose( Roles.C.Verbose.MAINTAIN, 'pwix:roles/src/server/js/maintain.js defining not-yet existing roles...' );

    // get currently defined roles
    // each role is listed with its direct children; this is not a recursive tree
    // the used method makes sure we get as many roles as we have defined, each with its direct children
    // as objects { _id: <role_name>, children: [ array of objects { _id: <role_name> } ] }
    const fetched = await alRoles.getAllRoles().fetchAsync();
    fetched.map(( it ) => { rolesAllRoles.push( it ); });

    // iterate on our roles, defining the missing ones
    if( Roles.configure().roles && Roles.configure().roles.hierarchy && Array.isArray( Roles.configure().roles.hierarchy )){
        await Promise.allSettled( Roles.configure().roles.hierarchy.map( async ( it ) => {
            await f_define( it );
        }));
    }

    _verbose( Roles.C.Verbose.MAINTAIN, 'pwix:roles/src/server/js/maintain.js defined roles all exist: fine' );
}

async function f_InheritanceCompleteness(){

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

        if( Roles.configure().roles && Roles.configure().roles.hierarchy && Array.isArray( Roles.configure().roles.hierarchy )){
            f_children( Roles.configure().roles.hierarchy, name, false );
        } else {
            result.push({ _id: name });
        }
        return result;        
    }

    // returns an array of just the _id (the names)
    function f_ids( array ){
        let res = [];
        array.forEach(( o ) => {
            res.push( o._id );
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

    /*
     * maintain the roles assignment completeness - make sure the inherited roles are complete
     */

    _verbose( Roles.C.Verbose.MAINTAIN, 'pwix:roles/src/server/js/maintain.js maintaining the roles inheritage completeness...' );

    Meteor.roleAssignment.find().fetchAsync()
        .then(( fetched ) => {
            let promises = [];
            fetched.forEach(( o ) => {
                //console.log( o );
                const inherited = f_inherited( o.role._id );
                const equals = f_compare( inherited, o.inheritedRoles );
                //console.log( o.role._id, inherited, typeof inherited, inherited.length, o.inheritedRoles, typeof o.inheritedRoles, o.inheritedRoles.length, equals );
                if( !equals ){
                    _verbose( Roles.C.Verbose.MAINTAIN, '   updating id='+o._id, o.role._id, 'user='+o.user._id );
                    promises.push( Meteor.roleAssignment.updateAsync({ _id: o._id }, { $set: { inheritedRoles: inherited }}));
                    o.inheritedRoles = [ ...inherited ];
                }
                rolesAssignments.push( o );
            });
            Promise.allSettled( promises );
        });

    _verbose( Roles.C.Verbose.MAINTAIN, 'pwix:roles/src/server/js/maintain.js roles inheritance is complete: fine.' );
}

// make sure we do not keep obsolete AND unused roles
//  obsolete but still used roles must first be de-assign before being removed
function f_CleanupObsoleteRoles(){
}

Meteor.startup( function(){
    if( Roles.configure().maintainHierarchy ){
        f_DefineNewRoles()
            .then(() => {
                f_InheritanceCompleteness();
            })
            .then(() => {
                f_CleanupObsoleteRoles();
            });
    } else {
        console.debug( 'pwix:roles maintainHierarchy=false' );
    }
});
