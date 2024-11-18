/*
 * pwix:roles/src/client/components/pr_view_scoped_pane/pr_view_scoped_pane.js
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

import { pwixI18n } from 'meteor/pwix:i18n';
import { Random } from 'meteor/random';

import './pr_view_scoped_pane.html';

Template.pr_view_scoped_pane.onCreated( function(){
    const self = this;

    self.PR = {
        // the main div
        accordionId: Random.id(),

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
            return { key: key, value: value };
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
        //console.debug( Template.currentData().roles.get().scoped );
    });
});

Template.pr_view_scoped_pane.onRendered( function(){
    const self = this;

    // open the first accordion (if any)
    self.$( '.pr-view-scoped-pane .accordion-collapse' ).first().addClass( 'show' );
});

Template.pr_view_scoped_pane.helpers({
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

    // whether the user already has any scoped role
    haveScoped(){
        return Object.keys( this.roles.get().scoped ).length > 0;
    },

    // string translation
    i18n( arg ){
        return pwixI18n.label( I18N, arg.hash.key );
    },

    // parms for a scoped tree for the current scoped role
    parmsTree( it ){
        return {
            ...this,
            wantScoped: true,
            scope: Template.instance().PR.byId( it )
        };
    },

    // the label to be displayed in the accordion
    scopeLabel( it ){
        const scope = Template.instance().PR.byId( it );
        return Roles._scopes.label( scope );
    }
});
