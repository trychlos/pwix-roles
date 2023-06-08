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

//import 'jquery/dist/jquery.min.js';
import 'jstree/dist/jstree.min.js';

import { pwixI18n as i18n } from 'meteor/pwix:i18n';
//import { pwixModal } from 'meteor/pwix:modal';

import '../../../common/js/index.js';

import '../../stylesheets/jstree-style.css';
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
        radical: 'prtree_'
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
});

Template.prEdit.onRendered( function(){
    const self = this;

    self.$( '.modal' ).modal( 'show' );

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
        console.log( 'ready.jstree' );
        self.PR.treeReady.set( true );
    })
    // 'create_node.jstree' data = { node, parent, position, jsTree instance }
    .on( 'create_node.jstree', ( event, data ) => {
        //console.log( 'create_node', event, data );
        //console.log( 'create_node', data.node );
        const done = 1+parseInt( self.PR.creationDone.get());
        self.PR.creationDone.set( done );
        //console.log( 'self.PR.creationDone', done );
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
        if( !self.PR.creationEnded.get() && self.PR.treeReady.get()){
            function f_role( o, parent=null ){
                //console.log( o );
                const id = 'checkbox_'+o.name;
                self.PR.creationAsked += 1;
                //console.log( 'self.PR.creationAsked', self.PR.creationAsked, o.name );
                self.$( '.pr-tree' ).jstree( true ).create_node( parent, { "id":self.PR.radical+o.name, "text":o.name, "children":[], "icon":false });
                if( o.children ){
                    o.children.every(( child ) => {
                        f_role( child, self.PR.radical+o.name );
                        return true;
                    });
                }
            }
            //console.log( pwixRoles );
            self.PR.creationAsked = 0;
            self.PR.creationDone.set( 0 );
            pwixRoles._conf.roles.hierarchy.every(( o ) => {
                f_role( o );
                return true;
            });
            self.PR.creationEnded.set( true );
        }
    });

    // at the end of the nodes creation, update the display
    self.autorun(() => {
        console.log( 'creationEnded='+self.PR.creationEnded.get(), 'creationAsked='+self.PR.creationAsked, 'creationDone='+self.PR.creationDone.get());
        if( self.PR.creationEnded.get() && self.PR.creationDone.get() === self.PR.creationAsked ){
            //console.log( 'refreshing tree' );
            self.$( '.pr-tree' ).jstree( true ).show_checkboxes();
            self.$( '.pr-tree' ).jstree( true ).open_all();
            self.$( '.modal' ).modal( 'handleUpdate' );
            self.PR.treeDone.set( true );
        }
    });

    // setup the intial set of user's roles
    self.autorun(() => {
        if( self.PR.treeDone.get()){
            self.PR.attributedRoles.get().every(( role ) => {
                const id = self.PR.radical+role;
                self.$( '.pr-tree' ).jstree( true ).check_node( id );
                return true;
            });
        }
    });

    // add a tag class to body element to let the stylesheet identify *this* modal
    $( 'body' ).addClass( 'prRoles-prEdit-class' );
});

Template.prEdit.helpers({
    // i18n namespace
    namespace(){
        return ROLES_I18N;
    },

    // set the mail address in the title
    title(){
        const self = Template.instance();
        const email = self.PR.user ? self.PR.user.emails[0].address : null;
        const key = email ? 'title_mail' : 'title';
        return i18n.label( ROLES_I18N, 'dialogs.'+key, email );
    }
});

Template.prEdit.events({
    // save the updates
    'click .pr-submit'( event, instance ){
        let checked = [];
        instance.$( '.pr-tree' ).jstree( true ).get_checked_descendants( '#' ).every(( id ) => {
            checked.push( id.replace( instance.PR.radical, '' ));
            return true;
        });
        const filtered = pwixRoles.filter( checked );
        instance.PR.attributedRoles.set( filtered );
        console.log( 'checked', checked, 'filtered', filtered );
        Meteor.call( 'pwixRoles.setUsersRoles', instance.PR.user._id, filtered );
        Meteor.call( 'pwixRoles.Accounts.Updated', instance.PR.user._id );
        instance.$( '.modal' ).modal( 'hide' );
        return false;
    },

    // remove the Blaze element from the DOM
    'hidden.bs.modal .prEdit'( event, instance ){
        $( 'body' ).removeClass( 'prRoles-prEdit-class' );
        Blaze.remove( instance.view );
    }
});
