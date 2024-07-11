/*
 * pwix:roles/src/client/components/edit_scoped_pane/edit_scoped_pane.js
 *
 *  Edit scoped roles.
 *  We display the scoped roles as a list of accordions <role> <scope>
 * 
 *  Parms:
 *  - roles: a ReactiveVar which contains the user roles, as an object { scoped: { <scope>: { all<Array>, direct<Array } }, global: { all<Array>, direct<Array } }
 *      (a deep copy of the user roles - so can be edited)
 *  - pr_div: the class name of the main div
 *  - pr_prefix: the prifx to be added to tree checkboxes
 *  - pr_none: a special identifier for new scope
 */

import _ from 'lodash';

import { Bootbox } from 'meteor/pwix:bootbox';
import { PlusButton } from 'meteor/pwix:plus-button';
import { pwixI18n } from 'meteor/pwix:i18n';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { Roles } from 'meteor/pwix:roles';

import './edit_scoped_pane.html';

Template.edit_scoped_pane.onCreated( function(){
    const self = this;

    self.PR = {
        // the main div
        accordionId: Random.id(),
        // whether the plus button is enabled
        enabledPlus: new ReactiveVar( true ),
        // whether we have the pwix:forms package
        haveForms: new ReactiveVar( false ),

        // does our edited roles already target the given scope identifier ?
        //  returns the scope
        byId( id ){
            let scope = null;
            const scoped = Template.currentData().roles.get().scoped;
            Object.keys( scoped ).every(( it ) => {
                if( scoped[it].DYN.id === id ){
                    scope = it;
                }
                return scope === null;
            });
            return scope;
        },

        // a new scope has been selected - update the roles list accordingly
        changeScope( event, id, newScope ){
            const roles = Template.currentData().roles.get();
            const oldScope = self.PR.byId( id );
            if( oldScope ){
                roles.scoped[newScope] = roles.scoped[oldScope];
                delete roles.scoped[oldScope];
                Template.currentData().roles.set( roles );
                // and avertize of the change
                self.$( event.currentTarget ).trigger( 'pr-change' );
            } else {
                console.warn( 'identifier not found', id );
            }
        },

        // a new scope is created
        //  attach to each scope object a label ReactiveVar and an invariant identifier
        newScope( key=null, value=null ){
            key = key || Template.currentData().pr_none;
            value = value || { all: [], direct: [] };
            value.DYN = value.DYN || {};
            if( !value.DYN.id ){
                // make sure the identifier begins with a letter
                value.DYN.id = 'pr'+Random.id();
            }
            if( !value.DYN.checkStatus && self.PR.haveForms.get()){
                value.DYN.checkStatus = new ReactiveVar( null );
            }
            return { key: key, value: value };
        },

        // after user confirmation, remove a scope and its roles
        removeScope( event, id ){
            const scope = self.PR.byId( id );
            if( scope ){
                const dataContext = Template.currentData();
                Bootbox.confirm({
                    message: pwixI18n.label( I18N, 'panels.remove_scope_confirm', Roles._scopes.label( scope )),
                    title: pwixI18n.label( I18N, 'panels.remove_scope_title' )
                }, ( res ) => {
                    if( res ){
                        const roles = dataContext.roles.get();
                        delete roles.scoped[scope];
                        dataContext.roles.set( roles );
                        // and avertize of the change (on the pane only)
                        self.$( '.pr-edit-scoped-pane' ).trigger( 'pr-change' );
                    }
                });
            } else {
                console.warn( 'identifier not found', id );
            }
        },

        // update the check status indicator
        setCheckStatus( scope, direct ){
            let status = 'UNCOMPLETE';
            if( scope && scope != Template.currentData().pr_none && direct.length ){
                status = 'VALID';
            }
            const o = Template.currentData().roles.get().scoped[scope];
            if( o && o.DYN && o.DYN.checkStatus ){
                o.DYN.checkStatus.set( Package['pwix:forms'].Forms.CheckStatus.C[status] );
            }
        }
    };

    // the scope identifier cannot be a node identifier has it can be null when new, or be modified
    //  so allocate a new internal identifier which will be used in the HTML code
    self.autorun(() => {
        const scoped = Template.currentData().roles.get().scoped;
        Object.keys( scoped ).forEach(( it ) => {
            const res = self.PR.newScope( it, scoped[it] );
            scoped[it] = res.value;
        });
    });

    // track the current scoped roles
    self.autorun(() => {
        console.debug( Template.currentData().roles.get().scoped );
    });

    // do we have the pwix:forms package ?
    self.autorun(() => {
        self.PR.haveForms.set( Package['pwix:forms'] && Package['pwix:forms'].Forms );
    });
});

Template.edit_scoped_pane.onRendered( function(){
    const self = this;

    // disable the 'plus' button while we have an unset scope
    self.autorun(() => {
        const scoped = Template.currentData().roles.get().scoped;
        const haveNone = Object.keys( scoped ).includes( Template.currentData().pr_none );
        self.PR.enabledPlus.set( !haveNone );
    });

    // open the first accordion (if any)
    self.$( '.pr-edit-scoped-pane .accordion-collapse' ).first().addClass( 'show' );
});

Template.edit_scoped_pane.helpers({
    // the identifier of the accordion div, once for the whole pane
    accordionId(){
        return Template.instance().PR.accordionId;
    },

    // a class attributed by the caller
    divClass(){
        return this.pr_div;
    },

    // the scoped roles attributed to this user
    //  we iterate on our internal invariant identifier
    editedList(){
        let items = [];
        const scoped = this.roles.get().scoped;
        Object.keys( scoped ).forEach(( it ) => {
            items.push( scoped[it].DYN.id );
        });
        return items;
    },

    // whether the pwix:forms package is present
    //  if yes then we will display a check status indicator
    haveForms(){
        return Template.instance().PR.haveForms.get();
    },

    // whether the user already has any scoped role
    haveScoped(){
        const scoped = this.roles.get().scoped;
        console.debug( 'haveScoped', Object.keys( scoped ).length > 0 );
        return Object.keys( scoped ).length > 0;
    },

    // string translation
    i18n( arg ){
        return pwixI18n.label( I18N, arg.hash.key );
    },

    // whether we are working on a new scope
    newScope( it ){
        const scope = Template.instance().PR.byId( it );
        return scope === this.pr_none;
    },

    // a helper to not hardcode the label in the html
    none(){
        return this.pr_none;
    },

    // whether the scope selection is enabled
    //  this is true while the scope has not been already selected
    optionEnabled( scope ){
        return this.roles.get().scoped[scope] ? 'disabled' : '';
    },

    // the label to be displayed for the scope in the select box
    //  it is an object from scopesList, with or without a label
    optionLabel( scope ){
        return Roles._scopes.label( scope );
    },

    // the label to be displayed for the scope in the select box
    //  it is an object from scopesList, with or without a label
    optionSelected( scope, it ){
        const roleScope = Template.instance().PR.byId( it );
        return scope === roleScope ? 'selected' : '';
    },

    // parms for the check status indicator
    //  only present if pwix:forms is loaded
    parmsCheckStatus( it ){
        const scope = it ? Template.instance().PR.byId( it ) : null;
        const o = scope ? this.roles.get().scoped[scope] : null;
        return o ? { statusRv: o.DYN.checkStatus } : {};
    },

    // parms for adding a new scope
    parmsPlusButton(){
        return {
            enabled: Template.instance().PR.enabledPlus,
            label: pwixI18n.label( I18N, 'panels.add_button' ),
            shape: PlusButton.C.Shape.RECTANGLE,
            title: pwixI18n.label( I18N, 'panels.add_title' ),
        };
    },

    // parms for a scoped tree for the current scoped role
    parmsTree( it ){
        return {
            ...this,
            wantScoped: true,
            scope: Template.instance().PR.byId( it )
        };
    },

    // list of scope ids
    scopesList(){
        return Object.keys( Roles._scopes.labels.all());
    }
});

Template.edit_scoped_pane.events({
    // clear the panel to initialize a new account
    /*
    'clear-panel .c-account-roles-panel'( event, instance ){
        instance.PR.edited.set( [] );
    },
    */

    // change the currently selected scope
    'change .js-scope'( event, instance ){
        const $parent = instance.$( event.currentTarget ).closest( '.accordion-header' );
        const id = $parent.prop( 'id' ).replace( /^header-/, '' );
        const newScope = $parent.find( '.js-scope :selected' ).val();
        instance.PR.changeScope( event, id, newScope );
    },

    // add a new accordion to enter into a new scope (and a new tree of roles)
    'click .js-plus'( event, instance ){
        let roles = this.roles.get();
        const res = instance.PR.newScope();
        roles.scoped[res.key] = res.value;
        this.roles.set( roles );
        instance.PR.setCheckStatus( res.key, res.value.direct );
        return false;
    },

    // remove the current scope and all its roles
    'click .js-minus'( event, instance ){
        const $parent = instance.$( event.currentTarget ).closest( '.scoped-item' ).find( '.accordion-header' );
        const id = $parent.prop( 'id' ).replace( /^header-/, '' );
        instance.PR.removeScope( event, id );
        return false;
    },

    // update the check status indicator (if any)
    'pr-change .scoped-item'( event, instance, data ){
        const $parent = instance.$( event.currentTarget ).find( '.accordion-header' );
        const id = $parent.prop( 'id' ).replace( /^header-/, '' );
        const scope = instance.PR.byId( id );
        const roles = Roles.EditPanel.scoped();
        instance.PR.setCheckStatus( scope, roles[scope] );
    },

    // select/unselect a role and/or change a scope
    'pr-change .pr-edit-scoped-pane'( event, instance, data ){
        const roles = Roles.EditPanel.scoped();
        instance.$( event.currentTarget ).trigger( 'pr-scoped-state', { roles: roles });
    }
});
