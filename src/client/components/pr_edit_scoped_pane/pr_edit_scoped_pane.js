/*
 * pwix:roles/src/client/components/pr_edit_scoped_pane/pr_edit_scoped_pane.js
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
import { pwixI18n } from 'meteor/pwix:i18n';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { Roles } from 'meteor/pwix:roles';

import './pr_edit_scoped_pane.html';

Template.pr_edit_scoped_pane.onCreated( function(){
    const self = this;

    self.PR = {
        // the main div
        accordionId: Random.id(),
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
        removeScope( event, id, $tree ){
            const scope = self.PR.byId( id );
            if( scope ){
                const dataContext = Template.currentData();
                Bootbox.confirm({
                    message: pwixI18n.label( I18N, 'panels.remove_scope_confirm', Roles._scopes.label( scope )),
                    title: pwixI18n.label( I18N, 'panels.remove_scope_title' )
                }, ( res ) => {
                    if( res ){
                        $tree.trigger( 'pr-delete' );
                        const roles = dataContext.roles.get();
                        delete roles.scoped[scope];
                        dataContext.roles.set( roles );
                    }
                });
            } else {
                console.warn( 'identifier not found', id );
            }
        },

        // update the check status indicator
        // $tree and prefix must be provided to (non-reactively) update the data context roles reactive var with the checked checkboxes
        updateStatus( scope, $tree, prefix ){
            let scopedRoles = Template.currentData().roles.get().scoped[scope];
            if( $tree && prefix ){
                let locals = [];
                $tree.jstree( true ).get_checked_descendants( '#' ).every(( id ) => {
                    locals.push( id.replace( prefix, '' ));
                    return true;
                });
                scopedRoles.direct = Roles._filter( locals );
            }
            let status = 'UNCOMPLETE';
            if( scope && scope != Template.currentData().pr_none && scopedRoles.direct.length ){
                status = 'VALID';
            }
            if( scopedRoles.DYN.checkStatus ){
                scopedRoles.DYN.checkStatus.set( Package['pwix:forms'].Forms.FieldStatus.C[status] );
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
        //console.debug( 'scoped', Template.currentData().roles.get().scoped );
    });

    // do we have the pwix:forms package ?
    self.autorun(() => {
        self.PR.haveForms.set( Package['pwix:forms'] && Package['pwix:forms'].Forms );
    });
});

Template.pr_edit_scoped_pane.onRendered( function(){
    const self = this;

    // open the first accordion (if any)
    self.$( '.pr-edit-scoped-pane .accordion-collapse' ).first().addClass( 'show' );
});

Template.pr_edit_scoped_pane.helpers({
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
        return Object.keys( this.roles.get().scoped ).length > 0;
    },

    // whether there is at least one available scope
    haveScopes(){
        return Object.keys( Roles._scopes.labels.all()).length > 0;
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

Template.pr_edit_scoped_pane.events({
    // change the currently selected scope
    'change .js-scope'( event, instance ){
        const $parent = instance.$( event.currentTarget ).closest( '.accordion-header' );
        const id = $parent.prop( 'id' ).replace( /^header-/, '' );
        const newScope = $parent.find( '.js-scope :selected' ).val();
        instance.PR.changeScope( event, id, newScope );
    },

    // add a new accordion to enter into a new scope (and a new tree of roles)
    'pr-new-scope .pr-edit-scoped-pane'( event, instance ){
        let roles = this.roles.get();
        const res = instance.PR.newScope();
        roles.scoped[res.key] = res.value;
        this.roles.set( roles );
        instance.PR.updateStatus( res.key );
        return false;
    },

    // remove the current scope and all its roles
    'click .js-minus'( event, instance ){
        const $parent = instance.$( event.currentTarget ).closest( '.scoped-item' );
        const id = $parent.find( '.accordion-header' ).prop( 'id' ).replace( /^header-/, '' );
        instance.PR.removeScope( event, id, $parent.find( '.'+this.pr_div ));
        return false;
    },

    // update the check status indicator (if any)
    //  get event at the item level to recompute only *this* status
    'pr-change .scoped-item'( event, instance, data ){
        const $parent = instance.$( event.currentTarget ).find( '.accordion-header' );
        const id = $parent.prop( 'id' ).replace( /^header-/, '' );
        instance.PR.updateStatus( instance.PR.byId( id ), instance.$( event.currentTarget ).find( '.'+this.pr_div ), this.pr_prefix );
    },

    // select/unselect a role and/or change a scope
    //  get event at the component level to recompute only once all the scopes and roles
    'pr-change .pr-edit-scoped-pane'( event, instance, data ){
        instance.$( event.currentTarget ).trigger( 'pr-scoped-state', { scoped: Roles.EditPanel.scoped() });
    }
});
