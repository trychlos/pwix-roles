/*
 * /imports/client/components/edit_scoped_pane/edit_scoped_pane.js
 *
 *  Edit scoped roles.
 *  We display the scoped roles as a list of accordions <role> <scope>
 * 
 *  Parms:
 *  - roles: a ReactiveVar which contains the user roles, as an object { scoped: { <scope>: { all<Array>, direct<Array } }, global: { all<Array>, direct<Array } }
 *      (a deep copy of the user roles - so can be edited)
 *  - pr_div: the class name of the main div
 */

import _ from 'lodash';

import { pwixI18n } from 'meteor/pwix:i18n';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { Roles } from 'meteor/pwix:roles';

import './edit_scoped_pane.html';

const NONE = 'NULL';

Template.edit_scoped_pane.onCreated( function(){
    const self = this;

    self.PR = {
        // the main div
        accordionId: Random.id(),
        // the scopes list provided by the caller
        scopesList: new ReactiveVar( [] ),
        // or a subcription to the used scopes
        handle: null,
        collection: null

        /*
        // the current edition state
        edited: new ReactiveVar( [] ),
        // the full available - defined - roles
        availableRoles: _.cloneDeep( Roles.flat()),
        // the edited roles
        editedRoles: new ReactiveVar( [] ),

        // returns the identified index in the 'edited' array
        getRole( rowId ){
            let roles = self.PR.edited.get();
            found = -1;
            for( let i=0 ; i<roles.length && found<0 ; ++i ){
                if( roles[i].DYN.rowid === rowId ){
                    found = i;
                }
            }
            if( found < 0 ){
                console.warn( 'role not found', rowId );
            }
            return found;
        },

        // initialize a new editable role object
        //  the role object is a document as returned from Roles.getRolesForUser()
        //  we allocate an object with:
        //  - rowid: a random id which uniquely identify the row
        //  - doc: the { _id, scope } role object as returned from Roles.getRolesForUser() or edited
        //      _id and scope are null for an unitialized row
        //  - DYN: some dyn variables
        newRole( o ){
            return {
                doc: { ...o },
                DYN: {
                    rowid: 'row-'+Random.id(),
                    scopeLabel: new ReactiveVar( pwixI18n.label( I18N, 'panels.no_role' )),
                    scopeEnabled: new ReactiveVar( false ),
                    scopeSelected: new ReactiveVar( NONE ),
                    lineValid: new ReactiveVar( false )
                }
            }
        },

        // a new role has been selected - reset the scope select box accordingly
        resetScope( roleObj ){
            let label = pwixI18n.label( I18N, 'accounts.panel.no_role' );
            let want_scope = false;
            if( roleObj.doc._id ){
                const o = self.PR.availableRoles[roleObj.doc._id];
                if( o && o.scoped === true ){
                    label = pwixI18n.label( I18N, 'accounts.panel.with_scope' );
                    want_scope = true;
                } else {
                    label = pwixI18n.label( I18N, 'accounts.panel.without_scope' );
                }
            }
            roleObj.DYN.scopeEnabled.set( want_scope );
            roleObj.DYN.scopeLabel.set( label );
            roleObj.DYN.scopeSelected.set( want_scope && roleObj.doc.scope ? roleObj.doc.scope : NONE );
        },

        // a new role has been selected - update the line accordingly
        //  role may be null on new row
        selectRole( rowId, roleName ){
            const idx = self.PR.getRole( rowId );
            if( idx >= 0 ){
                let roleObj = self.PR.edited.get()[idx];
                roleObj.doc._id = roleName;
                self.PR.resetScope( roleObj );
                self.PR.updateCheck( roleObj );
            }
        },

        // a new scope has been selected - update the line accordingly
        selectScope( rowId, scope ){
            const idx = self.PR.getRole( rowId );
            if( idx >= 0 ){
                let roleObj = self.PR.edited.get()[idx];
                roleObj.doc.scope = scope;
                self.PR.updateCheck( roleObj );
            }
        },

        // send panel data
        sendPanelData( data, ok ){
            self.$( '.c-account-roles-panel' ).trigger( 'panel-data', {
                emitter: 'roles',
                data: data,
                ok: ok
            });
        },

        // check the line when both role and scope are valid
        updateCheck( roleObj ){
            const roleValid = Boolean( roleObj.doc._id && roleObj.doc._id.length > 0 );
            let scopeValid = false;
            if( roleValid ){
                scopeValid = ( self.PR.availableRoles[roleObj.doc._id].scoped === true ) ? roleObj.doc.scope !== null : roleObj.doc.scope === null;
            }
            //console.debug( roleObj, 'roleValid', roleValid, 'scopeValid', scopeValid );
            roleObj.DYN.lineValid.set( roleValid && scopeValid );
        }
    */
    };

    // maybe the scopes list is provided by the application ?
    //  else default to already used scopes
    self.autorun(() => {
        const scopesFn = Roles.configure().scopesFn;
        let list = [];
        if( scopesFn ){
            scopesFn().then(( res ) => {
                res = _.isArray( res ) ? res : [res];
                res.forEach(( it ) => {
                    if( _.isString( it )){
                        list.push({ _id: it });
                    } else if( _.isObject( it ) && it._id ){
                        list.push( it );
                    } else {
                        console.warn( 'expect a { _id, label } object, found', it );
                    }
                });
                self.PR.scopesList.set( list );
            });
        } else {
            self.PR.handle = self.subscribe( 'pwix_roles_used_scopes' );
            self.PR.collection = new Mongo.Collection( 'pwix_roles_used_scopes' );
        }
    });

    // get the publication content
    self.autorun(() => {
        if( self.PR.handle && self.PR.handle.ready()){
            self.PR.collection.find().fetchAsync().then(( fetched ) => {
                console.debug( 'fetched', fetched );
                self.PR.scopesList.set( fetched );
            });
        }
    });

    /*
    // track the edited roles
    self.autorun(() => {
        console.debug( self.PR.editedRoles.get())
    });
    */
});

Template.edit_scoped_pane.onRendered( function(){
    const self = this;

    /*
    // track the edited roles and advertizes listeners
    self.autorun(() => {
        let data = [];
        let ok = true;
        self.PR.edited.get().every(( o ) => {
            ok &&= o.DYN.lineValid.get();
            data.push( o.doc );
            return true;
        });
        self.PR.sendPanelData( data, ok );
    });
    */
});

Template.edit_scoped_pane.helpers({
    // the identifier of the accordion div, once for the whole pane
    accordionId(){
        return Template.instance().PR.accordionId;
    },

    // the scoped roles attributed to this user
    //  attach to each scope object a label ReactiveVar
    editedList(){
        const scopeLabelFn = Roles.configure().scopeLabelFn;
        const scoped = this.roles.get().scoped;
        const scopes = Object.keys( scoped );
        scopes.forEach(( it ) => {
            let scope = scoped[it];
            scope.DYN = scope.DYN || {};
            if( !scope.DYN.label ){
                scope.DYN.label = new ReactiveVar( it );
                if( scopeLabelFn ){
                    scopeLabelFn( it ).then(( res ) => { scope.DYN.label.set( res || it ); });
                }
            }
        });
        return scopes;
    },

    // string translation
    i18n( arg ){
        return pwixI18n.label( I18N, arg.hash.key );
    },

    // whether we are working on a new scope
    newScope( scope ){
        return scope === NONE;
    },

    // list of known organizations
        /*
    organizationsList(){
        const APP = Template.instance().PR;
        if( APP.handle.ready()){
            const raw = Organizations.find().fetch();
            const grouped = Meteor.PR.Validity.group( raw, { id: 'entity' });
            return grouped;
        }
        return [];
    },
            */

    // closest label of the organization
    /*
    orgLabel( it ){
        const closest = Meteor.PR.Validity.closest( it.items )
        return closest.record.label;
    },*/

    // parms for a scoped tree for the current scoped role
    parmsTree( scope ){
        return {
            ...this,
            wantScoped: true,
            scope: scope
        };
    },

    // parms for prEditPanel roles edition panel
    /*
    parmsRoles(){
        return {
            roles: Template.instance().PR.editedRoles
        };
    },

    // the available scoped roles as an array
    //  only display those that the current user is allowed to attribute
    rolesList(){
        return Object.values( Template.instance().PR.availableRoles );
    },

    // disable the global roles already selected (scoped roles may be chosen several times expecting different scopes)
    roleDisabled( roleObj, optionRole ){
        let disabled = false;
        Template.instance().PR.edited.get().every(( o ) => {
            if( o.doc._id === optionRole.name && optionRole.scoped !== true ){
                disabled = true;
            }
            return disabled === false;
        });
        return disabled ? 'disabled' : '';
    },

    // whether this role must be initially selected
    //  if the initial roles list is empty or this is a new role row, then select NONE
    //  else select the corresponding item
    roleSelected( roleObj, optionRole ){
        let selected = false;
        if( roleObj.doc._id ){
            selected = ( optionRole.name === roleObj.doc._id );
        } else {
            selected = ( optionRole.name === NONE );
        }
        if( selected ){
            Template.instance().PR.selectRole( roleObj.DYN.rowid, roleObj.doc._id );
        }
        return selected ? 'selected' : '';
    },
    */

    // whether the scope selection is enabled
    //  this is true when there is not yet any role if this scope
    scopeEnabled( it ){
        const scoped = this.roles.get().scoped;
        return scoped[it] && scoped[it].all && scoped[it].all.length ? 'disabled' : '';
    },

    // the label to be displayed for the scope
    //  scope here may be a scope identifier, or an object { _id, label }
    scopeLabel( scope ){
        let label = '';
        if( _.isString( scope )){
            label = this.roles.get().scoped[scope].DYN.label.get() || scope;
        } else if( _.isObject( scope ) && scope._id ){
            label = scope.label || scope;
        } else {
            console.warn( 'expect a string identifier or a { _id, label } object, got', scope );
        }
        return label;
    },

    // list of scope ids
    scopesList(){
        return Template.instance().PR.scopesList.get();
    }

    /*
    // the scope option to be selected has been computed when the role has been selected
    scopeSelected( roleObj, itOrg ){
        const wanted = roleObj.DYN.scopeSelected.get() || NONE;
        if( wanted === NONE ){
            selected = itOrg === NONE;
        } else {
            selected = ( itOrg.entity === wanted );
        }
        return selected ? 'selected' : '';
    },

    // display a check if the line is valid
    transparentIfNotValid( it ){
        return it.DYN.lineValid.get() ? '' : 'x-transparent';
    }
        */
});

Template.edit_scoped_pane.events({
    // clear the panel to initialize a new account
    /*
    'clear-panel .c-account-roles-panel'( event, instance ){
        instance.PR.edited.set( [] );
    },
    */

    // change the currently selected role
    //  update the label of the scope box accordingly
    /*
    'change .js-role'( event, instance ){
        const rowId = instance.$( event.currentTarget ).closest( 'tr' ).data( 'row-id' );
        const role = instance.$( 'tr[data-row-id="'+rowId+'"]' ).find( '.js-role :selected' );
        //console.debug( 'rowId', rowId, 'role', role.val());
        instance.PR.selectRole( rowId, role.val());
    },
    */

    // change the currently selected scope
    /*
    'change .js-scope'( event, instance ){
        const rowId = instance.$( event.currentTarget ).closest( 'tr' ).data( 'row-id' );
        const scope = instance.$( 'tr[data-row-id="'+rowId+'"]' ).find( '.js-scope :selected' );
        instance.PR.selectScope( rowId, scope.val());
    },
    */

    // add a new accordion to enter into a new scope (and a new tree of roles)
    'click .js-plus'( event, instance ){
        let roles = this.roles.get();
        roles.scoped[NONE] = { all: [], direct: [] };
        this.roles.set( roles );
        return false;
    },

    /*
    // remove the current role
    'click .js-minus'( event, instance ){
        const rowId = instance.$( event.currentTarget ).closest( 'tr' ).data( 'row-id' );
        const idx = instance.PR.getRole( rowId );
        if( idx >= 0 ){
            let roles = instance.PR.edited.get();
            roles.splice( idx, 1 );
            instance.PR.edited.set( roles );
        }
        return false;
    },
    */

    // select/unselect a role
    'pr-change .pr-edit-scoped-pane'( event, instance, data ){
        console.debug( event, data );
    }
});
