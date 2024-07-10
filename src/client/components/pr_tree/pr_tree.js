/*
 * pwix:roles/src/client/components/pr_tree/pr_tree.js
 *
 *  A component which presents a hierarchy of roles.
 *  This component is meant to be included:
 *  - either in a panel to edit global roles (no scope)
 *  - or in a select box to edit scoped roles (scope per scope).
 * 
 *  Parms:
 *  - wantScoped: whether we are editing global or scoped roles
 *      true|false, defaulting to false (default is to edit global roles)
 *  - scope: the current scope, may be null for a new role for example
 *      ignored when editing global roles
 *  - roles: a ReactiveVar which contains the to-be-edited roles, as an object { scoped: { <scope>: { all<Array>, direct<Array } }, global: { all<Array>, direct<Array } }
 *      (a deep copy of the initial roles - so can be edited)
 *  - pr_div: the class name of the main div
 *  - pr_prefix: the prefix of the checkbox nodes
 *  - pr_edit: whether we want be able to edit, defaulting to true
 */

import './pr_tree.html';

Template.pr_tree.onCreated( function(){
    const self = this;

    self.PR = {
        // tree loading vars
        $tree: new ReactiveVar( null ),
        tree_ready_rv: new ReactiveVar( false ),
        tree_nodes_asked: {},
        tree_nodes_created: {},
        tree_nodes_waiting: {},
        tree_done_rv: new ReactiveVar( false ),
        tree_dataset_rv: new ReactiveVar( false ),

        // whether the tree is readonly
        readOnly: new ReactiveVar( false ),

        // we have explicitely or programatically checked an item (but cascade doesn't come here)
        //  data = { node, selected, event, jsTree instance }
        tree_checkbox_check( data ){
            const $tree = self.PR.$tree.get();
            data.node.children_d.every(( id ) => {
                $tree.jstree( true ).disable_node( id );
                return true;
            });
            $tree.trigger( 'pr-change' );
        },

        // we have explicitely or programatically unchecked an item (but cascade doesn't come here)
        //  data = { node, selected, event, jsTree instance }
        tree_checkbox_uncheck( data ){
            const $tree = self.PR.$tree.get();
            data.node.children_d.forEach(( id ) => {
                $tree.jstree( true ).enable_node( id );
            });
            $tree.trigger( 'pr-change' );
        },

        // ask for create a new node for the tree
        //  if not null, wait for the parent be available
        //  role = { name, scoped, children } and its id will be radical+role.name
        tree_create_ask( role, parent=null ){
            if( parent ){
                if( Object.keys( self.PR.tree_nodes_created ).includes( parent.name )){
                    self.PR.tree_create_node( role, parent );
                } else if( Object.keys( self.PR.tree_nodes_asked ).includes( parent.name )){
                    if( !Object.keys( self.PR.tree_nodes_waiting ).includes( parent.name )){
                        self.PR.tree_nodes_waiting[ parent.name ] = [];
                    }
                    self.PR.tree_nodes_waiting[ parent.name ].push( role );
                } else {
                    // if the parent has not been asked, then it is unknown here -> say it is null
                    self.PR.tree_create_node( role );
                }
            } else {
                self.PR.tree_create_node( role );
            }
        },

        // track the creation of nodes
        //  and run the creation of waiting children
        //  data = { node, parent, position, jsTree instance }
        tree_create_done( data ){
            const role = data.node.original.doc;
            self.PR.tree_nodes_created[ role.name ] = data.node;
            delete self.PR.tree_nodes_asked[ role.name ];
            if( Object.keys( self.PR.tree_nodes_waiting ).includes( role.name )){
                self.PR.tree_nodes_waiting[ role.name ].forEach(( child ) => {
                    self.PR.tree_create_ask( child, role );
                });
                delete self.PR.tree_nodes_waiting[ role.name ];
            }
            // when we have created all the nodes...
            if( Object.keys( self.PR.tree_nodes_waiting ).length === 0 ){
                self.PR.tree_done( true );
            }
        },

        // create a new node
        //  the caller has made sure the parent is available if not null
        tree_create_node( role, parent=null ){
            self.PR.tree_nodes_asked[role.name] = role;
            const parent_node = parent ? self.PR.tree_nodes_created[ parent.name ] : null;
            const $tree = self.PR.$tree.get();
            $tree.jstree( true ).create_node( parent_node, {
                "id": self.data.pr_prefix + role.name,
                "text": role.name,
                "children": [],
                "icon": false,
                "doc": role
            });
        },

        // getter/setter: whether the initial data has been set in the tree (whether checkboxes are checked)
        tree_dataset( set ){
            if( set === true || set === false ){
                self.PR.tree_dataset_rv.set( set );
            }
            return self.PR.tree_dataset_rv.get();
        },

        // getter/setter: whether the creation of the tree is done
        tree_done( done ){
            if( done === true || done === false ){
                self.PR.tree_done_rv.set( done );
            }
            return self.PR.tree_done_rv.get();
        },

        // getter/setter: whether the tree is ready
        tree_ready( ready ){
            if( ready === true || ready === false ){
                self.PR.tree_ready_rv.set( ready );
            }
            return self.PR.tree_ready_rv.get();
        },
    };

    // setup the edition flag
    self.autorun(() => {
        self.PR.readOnly.set( Template.currentData().pr_edit === false );
    });

    // track the received roles
    self.autorun(() => {
        //console.debug( Template.currentData().roles.get());
    });
});

Template.pr_tree.onRendered( function(){
    const self = this;

    // identify the tree node as soon as possible
    self.autorun(() => {
        let $tree = self.PR.$tree.get();
        if( !$tree ){
            $tree = self.$( '.'+Template.currentData().pr_div );
            self.PR.$tree.set( $tree );
        }
    })

    // and build the tree
    self.autorun(() => {
        const $tree = self.PR.$tree.get();
        if( $tree ){
            $tree.jstree({
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
                    'conditionalselect',
                    'wholerow'
                ],
                checkbox: {
                    three_state: false,
                    cascade: 'down',
                    whole_node: true,
                    tie_selection: false
                },
                conditionalselect( node, event ){
                    return !self.PR.readOnly.get();
                }
            })
            // 'ready.jstree' data = jsTree instance
            .on( 'ready.jstree', ( event, data ) => {
                self.PR.tree_ready( true );
            })
            // 'create_node.jstree' data = { node, parent, position, jsTree instance }
            .on( 'create_node.jstree', ( event, data ) => {
                self.PR.tree_create_done( data );
            })
            // 'check_node.jstree' data = { node, selected, event, jsTree instance }
            .on( 'check_node.jstree', ( event, data ) => {
                self.PR.tree_checkbox_check( data );
            })
            // 'uncheck_node.jstree' data = { node, selected, event, jsTree instance }
            .on( 'uncheck_node.jstree', ( event, data ) => {
                self.PR.tree_checkbox_uncheck( data );
            })
            // 'enable_checkbox.jstree' data = { node, jsTree instance }
            .on( 'enable_node.jstree', ( event, data ) => {
                $tree.jstree( true ).get_node( data.node.id, true ).removeClass( 'pr-disabled' );
            })
            // 'disable_checkbox.jstree' data = { node, jsTree instance }
            .on( 'disable_node.jstree', ( event, data ) => {
                $tree.jstree( true ).get_node( data.node.id, true ).addClass( 'pr-disabled' );
            });
        }
    });

    // build the roles tree
    //  displaying the roles hierarchy that the current user is allowed to give to someone else
    self.autorun(() => {
        const $tree = self.PR.$tree.get();
        if( $tree && self.PR.tree_ready() && !self.PR.tree_done()){
            const wantScoped = Template.currentData().wantScoped === true;
            let promises = [];
            // display the role and its children if:
            //  - role is global or scoped depending of wantScoped
            //  - the current user has it which means he is allowed to give it
            async function f_role( role, parent=null, scoped=false ){
                Roles.userIsInRoles( Meteor.userId(), role.name, { anyScope: true }).then(( res ) => {
                    //console.debug( role.name, res );
                    if( res && (( wantScoped && ( role.scoped === true || scoped === true )) || ( !wantScoped && !role.scoped && !scoped ))){
                        self.PR.tree_create_ask.bind( self )( role, parent );
                    }
                    if( role.children ){
                        role.children.forEach(( it ) => {
                            promises.push( f_role( it, role, role.scoped || scoped ));
                        });
                    }
                });
            }
            //console.log( Roles );
            Roles.configure().roles.hierarchy.forEach(( it ) => {
                promises.push( f_role( it ));
            });
            Promise.allSettled( promises ).then(() => {
                // nothing to do here
            });
        }
    });

    // at the end of the nodes creation, update the display
    self.autorun(() => {
        if( self.PR.tree_done()){
            const $tree = self.PR.$tree.get();
            $tree.jstree( true ).show_checkboxes();
            $tree.jstree( true ).open_all();
            //self.$( '.modal' ).modal( 'handleUpdate' );
            const radical = Template.currentData().pr_prefix;
            const wantScoped = Template.currentData().wantScoped === true;
            if( wantScoped ){
                const scope = Template.currentData().scope;
                if( scope ){
                    Template.currentData().roles.get().scoped[scope].direct.forEach(( role ) => {
                        const id = radical+role;
                        $tree.jstree( true ).check_node( id );
                    });
                }
            } else {
                Template.currentData().roles.get().global.direct.forEach(( role ) => {
                    const id = radical+role;
                    $tree.jstree( true ).check_node( id );
                });
            }
            self.PR.tree_dataset( true );
        }
    });
});

Template.pr_tree.helpers({
    // name of the main class
    divClass(){
        return this.pr_div;
    }
});
