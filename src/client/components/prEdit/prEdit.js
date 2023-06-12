/*
 * /imports/client/components/roles_edit/roles_edit.js
 *
 *  Edit the roles of the specified user.
 * 
 *  Parms:
 *  - id: optional, the user identifier
 *  - user: optional, the user full record
 *  - roles: optional, a reactive var which is expected to contain the list of attributed roles
 * 
 *  Order of precedence is:
 *  1. id
 *  2. user
 *  3. roles
 *      If 'id' is specified, this is enough and the component takes care of read the attributed roles of the identified user.
 *      Else, if user is identified, then the component takes care of read the attributed roles of the user.
 *      Else, if roles are specified, then they are edited, and updated in this var.
 * 
 *  As a side effect, if an information is given about the user (id or user itself), then the mail address is displayed
 *  in the dialog title.
 */

import 'jstree/dist/jstree.min.js';

import { pwixI18n } from 'meteor/pwix:i18n';
import { pwixModal } from 'meteor/pwix:modal';

import '../../../common/js/index.js';

import '../../stylesheets/pr_roles.less';

import './prEdit.html';

Template.prEdit.onCreated( function(){
    const self = this;

    self.PR = {
        // input parms
        user: null,
        attributedRoles: null,
        // tree loading vars
        treeReady: new ReactiveVar( false ),
        treeDone: new ReactiveVar( false ),
        creationAsked: 0,
        creationDone: new ReactiveVar( 0 ),
        creationEnded: new ReactiveVar( false ),
        radical: 'prtree_',
        view: self.view
    };

    // get user informations if possible
    // if 'id' is specified, then get a user record and get the attributed roles
    // if a 'user' is specified, fine
    self.autorun(() => {
        if( Template.currentData().id ){
            Meteor.call( 'pwixRoles.Accounts.User', Template.currentData().id, ( err, res ) => {
                if( err ){
                    console.error( err );
                } else {
                    self.PR.user = res;
                }
            });
        } else if( Template.currentData().user ){
            self.PR.user = Template.currentData().user;
        }
    });

    // if a 'roles' is specified, it is expected to be a reactive var with the list of vars
    //  else create a new one
    self.autorun(() => {
        if( Template.currentData().roles ){
            self.PR.attributedRoles = Template.currentData().roles;
        } else {
            self.PR.attributedRoles = new ReactiveVar( null );
            self.PR.attributedRoles.set( pwixRoles.directRolesForUser( self.PR.user ));
        }
    });

    // creates the modal
    self.autorun(() => {
        const email = self.PR.user ? self.PR.user.emails[0].address : null;
        const key = email ? 'title_mail' : 'title';
        pwixModal.run({
            mdBody: 'prEdit_body',
            mdFooter: 'prEdit_footer',
            mdTitle: pwixI18n.label( I18N, 'dialogs.'+key, email ),
            PR: self.PR
        });
    });
});

Template.prEdit.onDestroyed( function(){
    //console.debug( 'prEdit.onDestroyed()' );
});

Template.prEdit_body.onRendered( function(){
    const self = this;
    let PR = null;

    self.autorun(() => {
        PR = Template.currentData().PR;
        PR.prTree = self.$( '.pr-tree' );
    });

    self.$( '.pr-tree' ).jstree({
        core: {
            check_callback( operation, node, node_parent, node_position, more ){
                switch( operation ){
                    case 'create_node':
                        return true;
                    default:
                        return false;
                }
            },
            multiple: false
        },
        plugins: [
            'checkbox',
            'wholerow'
        ],
        checkbox: {
            three_state: false,
            cascade: 'down',
            whole_node: true,
            tie_selection: false
        }
    })
    // 'ready.jstree' data = jsTree instance
    .on( 'ready.jstree', ( event, data ) => {
        //console.log( 'ready.jstree' );
        PR.treeReady.set( true );
    })
    // 'create_node.jstree' data = { node, parent, position, jsTree instance }
    .on( 'create_node.jstree', ( event, data ) => {
        //console.log( 'create_node', event, data );
        //console.log( 'create_node', data.node );
        const done = 1+parseInt( PR.creationDone.get());
        PR.creationDone.set( done );
        //console.debug( 'PR.creationDone', done );
    })
    // 'check_node.jstree' data = { node, selected, event, jsTree instance }
    //  triggered when we explicitely check an item
    .on( 'check_node.jstree', ( event, data ) => {
        //console.log( 'check_node', event, data );
        data.node.children_d.every(( id ) => {
            self.$( '.pr-tree' ).jstree( true ).disable_checkbox( id );
            return true;
        });
    })
    // 'uncheck_node.jstree' data = { node, selected, event, jsTree instance }
    //  triggered when we explicitely uncheck an item
    .on( 'uncheck_node.jstree', ( event, data ) => {
        //console.log( 'check_node', event, data );
        data.node.children_d.every(( id ) => {
            self.$( '.pr-tree' ).jstree( true ).enable_checkbox( id );
            return true;
        });
    })
    // 'enable_checkbox.jstree' data = { node, jsTree instance }
    .on( 'enable_checkbox.jstree', ( event, data ) => {
        //console.log( 'enable_checkbox', event, data );
        self.$( '.pr-tree' ).jstree( true ).get_node( data.node.id, true ).removeClass( 'pr-disabled' );
    })
    // 'disable_checkbox.jstree' data = { node, jsTree instance }
    .on( 'disable_checkbox.jstree', ( event, data ) => {
        //console.log( 'disable_checkbox', event, data );
        //console.log( self.$( '.pr-tree' ).jstree( true ).get_node( data.node.id ));
        self.$( '.pr-tree' ).jstree( true ).get_node( data.node.id, true ).addClass( 'pr-disabled' );
    });

    // load data in the roles tree
    //  displaying the roles hierarchy
    self.autorun(() => {
        if( !PR.creationEnded.get() && PR.treeReady.get()){
            function f_role( o, parent=null ){
                //console.log( o );
                const id = 'checkbox_'+o.name;
                PR.creationAsked += 1;
                //console.debug( 'PR.creationAsked', PR.creationAsked, o.name );
                self.$( '.pr-tree' ).jstree( true ).create_node( parent, { "id":PR.radical+o.name, "text":o.name, "children":[], "icon":false });
                if( o.children ){
                    o.children.every(( child ) => {
                        f_role( child, PR.radical+o.name );
                        return true;
                    });
                }
            }
            //console.log( pwixRoles );
            PR.creationAsked = 0;
            PR.creationDone.set( 0 );
            pwixRoles._conf.roles.hierarchy.every(( o ) => {
                f_role( o );
                return true;
            });
            PR.creationEnded.set( true );
        }
    });

    // at the end of the nodes creation, update the display
    self.autorun(() => {
        //console.debug( 'creationEnded='+PR.creationEnded.get(), 'creationAsked='+PR.creationAsked, 'creationDone='+PR.creationDone.get());
        if( PR.creationEnded.get() && PR.creationDone.get() === PR.creationAsked ){
            //console.log( 'refreshing tree' );
            self.$( '.pr-tree' ).jstree( true ).show_checkboxes();
            self.$( '.pr-tree' ).jstree( true ).open_all();
            self.$( '.modal' ).modal( 'handleUpdate' );
            PR.treeDone.set( true );
        }
    });

    // setup the intial set of user's roles
    self.autorun(() => {
        if( PR.treeDone.get()){
            PR.attributedRoles.get().every(( role ) => {
                const id = PR.radical+role;
                self.$( '.pr-tree' ).jstree( true ).check_node( id );
                return true;
            });
        }
    });
});

Template.prEdit_body.onDestroyed( function(){
    //console.debug( 'prEdit_body.onDestroyed()' );
});

Template.prEdit_footer.helpers({
    // i18n namespace
    i18n( opts ){
        return pwixI18n.label( I18N, opts.hash.key );
    }
});

Template.prEdit_footer.events({
    // save the updates
    'click .pr-submit'( event, instance ){
        let checked = [];
        const PR = Template.currentData().PR;
        PR.prTree.jstree( true ).get_checked_descendants( '#' ).every(( id ) => {
            checked.push( id.replace( PR.radical, '' ));
            return true;
        });
        const filtered = pwixRoles._filter( checked );
        PR.attributedRoles.set( filtered );
        //console.log( 'checked', checked, 'filtered', filtered );
        Meteor.call( 'pwixRoles.setUsersRoles', PR.user._id, filtered );
        Meteor.call( 'pwixRoles.Accounts.Updated', PR.user._id );
        pwixModal.close();
        return false;
    }
});

Template.prEdit_footer.onDestroyed( function(){
    //console.debug( 'prEdit_footer.onDestroyed()' );
    //console.debug( this );
    Blaze.remove( Template.currentData().PR.view );
});
