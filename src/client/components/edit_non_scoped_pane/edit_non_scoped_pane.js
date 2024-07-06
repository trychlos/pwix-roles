/*
 * /imports/client/components/edit_non_scoped_pane/edit_non_scoped_pane.js
 *
 *  Edit non-scoped roles.
 * 
 *  Parms:
 *  - id: optional, the user identifier
 *  - user: optional, the user full record
 *  - roles: optional, a reactive var which is expected to contain the initial array of attributed roles
 * 
 *  Order of precedence is:
 *  1. id
 *  2. user
 *  3. roles
 * 
 *  If 'id' is specified, this is enough and the component takes care of read the attributed roles of the identified user.
 *  Else, if user is identified, then the component takes care of read the attributed roles of the user.
 *  Else, if roles are specified, then they are edited from this var.
 * 
 *  If none of these three parms is specified, then the edition begins with an empty state.
 */

import './edit_non_scoped_pane.html';

Template.edit_non_scoped_pane.onCreated( function(){
    const self = this;

    self.PR = {
        // input parms
        user: new ReactiveVar( null ),
        attributedRoles: new ReactiveVar( [] ),
        // tree loading vars
        treeReady: new ReactiveVar( false ),
        treeDone: new ReactiveVar( false ),
        creationAsked: 0,
        creationDone: new ReactiveVar( 0 ),
        creationEnded: new ReactiveVar( false ),
        // do not change or update Roles.EditPanel.checked()
        radical: 'prtree_'
    };

    // get user informations if possible
    // if 'id' is specified, then get the user record
    self.autorun(() => {
        if( Template.currentData().id && !Template.currentData().user ){
            Meteor.call( 'Roles.Accounts.User', Template.currentData().id, ( err, res ) => {
                if( err ){
                    console.error( err );
                } else {
                    self.PR.user.set( res );
                }
            });
        }
    });

    // get user informations if possible
    // if a 'user' is specified, fine
    self.autorun(() => {
        if( Template.currentData().user ){
            self.PR.user.set( Template.currentData().user );
        }
    });

    // if a 'roles' is specified, it is expected to be a reactive var with the list of roles
    //  else create a new one (expects a user has previously been set)
    self.autorun(() => {
        if( Template.currentData().roles ){
            self.PR.attributedRoles = Template.currentData().roles;
        }
    });

    // if an id or a user was specified, get the roles of the user
    self.autorun(() => {
        const user = self.PR.user.get();
        if( user ){
            self.PR.attributedRoles.set( Roles.directRolesForUser( user ));
        }
    });
});

Template.edit_non_scoped_pane.onRendered( function(){
    const self = this;

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
        self.PR.treeReady.set( true );
    })
    // 'create_node.jstree' data = { node, parent, position, jsTree instance }
    .on( 'create_node.jstree', ( event, data ) => {
        //console.log( 'create_node', event, data );
        //console.log( 'create_node', data.node );
        const done = 1+parseInt( self.PR.creationDone.get());
        self.PR.creationDone.set( done );
        //console.debug( 'self.PR.creationDone', done );
    })
    // 'check_node.jstree' data = { node, selected, event, jsTree instance }
    //  triggered when we explicitely check an item
    .on( 'check_node.jstree', ( event, data ) => {
        //console.log( 'check_node', event, data );
        data.node.children_d.every(( id ) => {
            //self.$( '.pr-tree' ).jstree( true ).disable_checkbox( id );
            self.$( '.pr-tree' ).jstree( true ).disable_node( id );
            return true;
        });
        self.$( '.pr-tree' ).trigger( 'pr-change' );
    })
    // 'uncheck_node.jstree' data = { node, selected, event, jsTree instance }
    //  triggered when we explicitely uncheck an item
    .on( 'uncheck_node.jstree', ( event, data ) => {
        //console.log( 'check_node', event, data );
        data.node.children_d.every(( id ) => {
            //self.$( '.pr-tree' ).jstree( true ).enable_checkbox( id );
            self.$( '.pr-tree' ).jstree( true ).enable_node( id );
            return true;
        });
        self.$( '.pr-tree' ).trigger( 'pr-change' );
    })
    // 'enable_checkbox.jstree' data = { node, jsTree instance }
    .on( 'enable_node.jstree', ( event, data ) => {
        //console.log( 'enable_node', event, data );
        self.$( '.pr-tree' ).jstree( true ).get_node( data.node.id, true ).removeClass( 'pr-disabled' );
    })
    // 'disable_checkbox.jstree' data = { node, jsTree instance }
    .on( 'disable_node.jstree', ( event, data ) => {
        //console.log( 'disable_node', event, data );
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
                //console.debug( 'self.PR.creationAsked', self.PR.creationAsked, o.name );
                self.$( '.pr-tree' ).jstree( true ).create_node( parent, { "id":self.PR.radical+o.name, "text":o.name, "children":[], "icon":false });
                if( o.children ){
                    o.children.every(( child ) => {
                        f_role( child, self.PR.radical+o.name );
                        return true;
                    });
                }
            }
            //console.log( Roles );
            self.PR.creationAsked = 0;
            self.PR.creationDone.set( 0 );
            Roles.configure().roles.hierarchy.every(( o ) => {
                f_role( o );
                return true;
            });
            self.PR.creationEnded.set( true );
        }
    });

    // at the end of the nodes creation, update the display
    self.autorun(() => {
        //console.debug( 'creationEnded='+self.PR.creationEnded.get(), 'creationAsked='+self.PR.creationAsked, 'creationDone='+self.PR.creationDone.get());
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
});

Template.edit_non_scoped_pane.events({
    'pr-change .edit_non_scoped_pane'( event, instance ){
        const roles = Roles.EditPanel.checked( instance.$( '.pr-tree' ));
        instance.$( '.edit_non_scoped_pane' ).trigger( 'pr-edit-state', { roles: roles });
    }
});
