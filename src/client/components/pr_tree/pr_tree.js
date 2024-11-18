/*
 * pwix:roles/src/client/components/pr_tree/pr_tree.js
 *
 *  A component which presents a hierarchy of roles, maybe with attached accounts.
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
 *      (can be a deep copy of the initial roles - so ready to be edited)
 *  - pr_div: the class name of the main div
 *  - pr_prefix: the prefix of the nodes, defaulting to none
 *  - pr_edit: whether we want be able to edit, defaulting to true
 *  - pr_selectable: whether we want be able to select rows, defaulting to true
 *  - withCheckboxes: whether to display a checkbox in front of each role, defaulting to true
 *  - accounts: an optional ReactiveVar which contains the array of accounts assignments from 'role-assignment' collection
 * 
 * Triggers:
 * - pr-change
 * - pr-rowselect
 */

import _ from 'lodash';
import { strict as assert } from 'node:assert';

import { AccountsHub } from 'meteor/pwix:accounts-hub';

import './pr_tree.html';

Template.pr_tree.onCreated( function(){
    const self = this;

    self.PR = {
        // whether to trace each step of the tree build
        traceBuild: false,
        // whether to be verbose when a status changes
        traceStatus: false,

        // tree loading vars
        $tree: new ReactiveVar( null ),
        tree_ready_rv: new ReactiveVar( false ),
        tree_nodes_asked: {},
        tree_nodes_created: {},
        tree_nodes_waiting: {},
        // the tree is first ready, then successively populated, checked, accounts, and built
        tree_populated_rv: new ReactiveVar( false ),
        tree_checked_rv: new ReactiveVar( false ),
        tree_accounts_rv: new ReactiveVar( false ),
        tree_built_rv: new ReactiveVar( false ),
        // a prefix for node identifiers
        pr_prefix: new ReactiveVar( '' ),
        // icons are only displayed when we manage roles AND accounts
        withIcons: new ReactiveVar( false ),

        // whether the tree is readonly
        readOnly: new ReactiveVar( false ),

        // whether the tree is readonly
        selectable: new ReactiveVar( true ),

        // whether we want checkboxes
        haveCheckboxes: new ReactiveVar( true ),

        // last built and populated roles tree 
        prevTree: null,

        // last and last-but-one built and populated accounts members
        prevAccounts: null,

        // whether trigger pr-change event
        //  doesn't trigger the event when checkboxes are programatically checked
        triggerChangeEvent: true,

        // we have explicitely or programatically checked an item (but cascade doesn't come here)
        //  data = { node, selected, event, jsTree instance }
        tree_checkbox_check( data ){
            const $tree = self.PR.$tree.get();
            data.node.children_d.every(( id ) => {
                $tree.jstree( true ).disable_node( id );
                return true;
            });
            if( self.PR.triggerChangeEvent ){
                //console.debug( 'triggering pr-change due to checkbox check' );
                $tree.trigger( 'pr-change' );
            }
        },

        // we have explicitely or programatically unchecked an item (but cascade doesn't come here)
        //  data = { node, selected, event, jsTree instance }
        tree_checkbox_uncheck( data ){
            const $tree = self.PR.$tree.get();
            data.node.children_d.forEach(( id ) => {
                $tree.jstree( true ).enable_node( id );
            });
            //console.debug( 'triggering pr-change due to checkbox uncheck' );
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
                self.PR.tree_populated( true );
            }
        },

        // create a new node
        //  the caller has made sure the parent is available if not null
        tree_create_node( role, parent=null ){
            self.PR.tree_nodes_asked[role.name] = role;
            const parent_node = parent ? self.PR.tree_nodes_created[ parent.name ] : null;
            const $tree = self.PR.$tree.get();
            $tree.jstree( true ).create_node( parent_node, {
                "id": self.PR.pr_prefix.get() + role.name,
                "text": role.name,
                "children": [],
                "icon": self.PR.withIcons.get(),
                "doc": role,
                "type": 'R'
            });
        },

        // delete a node
        //  a node has been deleted
        tree_delete_node( data ){
        },

        // getter/setter: whether the creation of the accounts is done (if apply)
        tree_accounts( done ){
            if( done === true || done === false ){
                self.PR.tree_accounts_rv.set( done );
            }
            return self.PR.tree_accounts_rv.get();
        },

        // getter/setter: whether the creation of the tree is done (populated+checked+accounts+opened)
        tree_built( done ){
            if( done === true || done === false ){
                self.PR.tree_built_rv.set( done );
            }
            return self.PR.tree_built_rv.get();
        },

        // getter/setter: whether the tree has been checked (if checkboxes are allowed)
        tree_checked( done ){
            if( done === true || done === false ){
                self.PR.tree_checked_rv.set( done );
            }
            return self.PR.tree_checked_rv.get();
        },

        // getter/setter: whether the tree has been populated
        tree_populated( done ){
            if( done === true || done === false ){
                self.PR.tree_populated_rv.set( done );
            }
            return self.PR.tree_populated_rv.get();
        },

        // getter/setter: whether the tree is ready
        tree_ready( ready ){
            if( ready === true || ready === false ){
                self.PR.tree_ready_rv.set( ready );
            }
            return self.PR.tree_ready_rv.get();
        }
    };

    // get the node identifier prefix
    self.autorun(() => {
        self.PR.pr_prefix.set( Template.currentData().pr_prefix || '' );
    });

    // setup the edition flag
    self.autorun(() => {
        self.PR.readOnly.set( Template.currentData().pr_edit === false );
    });

    // setup the selectable flag
    self.autorun(() => {
        self.PR.selectable.set( Template.currentData().pr_selectable !== false );
    });

    // setup the checkboxes flag
    self.autorun(() => {
        self.PR.haveCheckboxes.set( Template.currentData().withCheckboxes !== false );
    });

    // make sure roles are set as a ReactiveVar
    self.autorun(() => {
        const roles = Template.currentData().roles;
        assert( roles && roles instanceof ReactiveVar );
    });

    // track the received roles -> have to rebuild the tree on changes
    self.autorun(() => {
        const roles = Template.currentData().roles.get();
        if( !_.isEqual( roles, self.PR.prevTree )){
            self.PR.prevTree = _.cloneDeep( roles );
            self.PR.tree_populated( false );
        }
    });

    // if accounts are provided, make sure it is a ReactiveVar
    self.autorun(() => {
        const accounts = Template.currentData().accounts;
        if( accounts ){
            assert( accounts instanceof ReactiveVar );
            self.PR.withIcons.set( true );
        }
    });

    // track the received accounts -> have to rebuild the accounts members on changes
    self.autorun(() => {
        const accounts = Template.currentData().accounts?.get();
        if( accounts && !_.isEqual( accounts, self.PR.prevAccounts )){
            self.PR.tree_accounts( false );
        }
    });

    // track the ready status
    self.autorun(() => {
        self.PR.traceStatus && console.debug( 'tree_ready', self.PR.tree_ready());
    });

    // track the populated status
    self.autorun(() => {
        self.PR.traceStatus && console.debug( 'tree_populated', self.PR.tree_populated());
    });

    // track the checked status
    self.autorun(() => {
        self.PR.traceStatus && console.debug( 'tree_checked', self.PR.tree_checked());
    });

    // track the accounts status
    self.autorun(() => {
        self.PR.traceStatus && console.debug( 'tree_accounts', self.PR.tree_accounts());
    });

    // track the built status
    self.autorun(() => {
        self.PR.traceStatus && console.debug( 'tree_built', self.PR.tree_built());
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
            let types = {
                'A': {},
                'R': {}
            };
            if( Template.currentData().accounts ){
                types.A.icon = 'type-account fa-solid fa-user';
                types.R.icon = 'type-role fa-solid fa-dice-d20';
            }
            let plugins = [
                'conditionalselect',
                'sort',
                'types',
                'wholerow'
            ];
            if( self.PR.haveCheckboxes.get()){
                plugins.push( 'checkbox' );
            }
            $tree.jstree({
                core: {
                    check_callback( operation, node, node_parent, node_position, more ){
                        switch( operation ){
                            case 'create_node':
                            case 'delete_node':
                                return true;
                            default:
                                return false;
                        }
                    },
                    multiple: false
                },
                plugins: plugins,
                checkbox: {
                    three_state: false,
                    cascade: 'down',
                    whole_node: true,
                    tie_selection: false
                },
                conditionalselect( node, event ){
                    return self.PR.selectable.get();
                },
                sort: function( a, b ){
                    const node_a = this.get_node( a );
                    const node_b = this.get_node( b );
                    const type = node_a.type > node_b.type ? 1 : ( node_a.type < node_b.type ? -1 : 0 );
                    const label_a = String( node_a.text ).toString().toUpperCase();
                    const label_b = String( node_b.text ).toString().toUpperCase();
                    return type ? type : ( label_a > label_b ? 1 : ( label_a < label_b ? -1 : 0 ));
                },
                types: types
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
            // 'delete_node.jstree' data = { node, parent, jsTree instance }
            .on( 'delete_node.jstree', ( event, data ) => {
                self.PR.tree_delete_node( data );
            })
            // 'enable_checkbox.jstree' data = { node, jsTree instance }
            .on( 'enable_node.jstree', ( event, data ) => {
                $tree.jstree( true ).get_node( data.node.id, true ).removeClass( 'pr-disabled' );
            })
            // 'disable_checkbox.jstree' data = { node, jsTree instance }
            .on( 'disable_node.jstree', ( event, data ) => {
                $tree.jstree( true ).get_node( data.node.id, true ).addClass( 'pr-disabled' );
            })
            // 'select_node.jstree' data = { node, jsTree instance }
            .on( 'select_node.jstree', ( event, { event2, instance, node, selected }) => {
                $tree.trigger( 'pr-rowselect', { node: node });
            });
        }
    });

    // populate the roles tree
    //  displaying the roles hierarchy that the current user is allowed to give to someone else
    //  we build here the structure opened to the user roles
    //  the built structure includes all the roles the current user has
    self.autorun(() => {
        const $tree = self.PR.$tree.get();
        const roles = Template.currentData().roles.get();
        if( $tree && self.PR.tree_ready() && !self.PR.tree_populated() && roles ){
            self.PR.traceBuild && console.debug( 'populate the tree', roles );
            // reset the tree
            $tree.jstree( true ).delete_node( Object.values( self.PR.tree_nodes_created ));
            self.PR.tree_nodes_asked = {};
            self.PR.tree_nodes_created = {};
            self.PR.tree_nodes_waiting = {};
            // and rebuild it
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
            Roles.configure().roles.hierarchy.forEach(( it ) => {
                promises.push( f_role( it ));
            });
            Promise.allSettled( promises ).then(() => {
                self.PR.tree_checked( false );
            });
        }
    });

    // at the end of the nodes creation, check the nodes with actual roles of the user
    //  send once pr-change event at the end of the task
    self.autorun(() => {
        const roles = Template.currentData().roles.get();
        if( self.PR.tree_populated() && !self.PR.tree_checked()){
            const haveCheckboxes = self.PR.haveCheckboxes.get();
            self.PR.traceBuild && console.debug( 'set checkboxes', haveCheckboxes );
            if( haveCheckboxes ){
                //console.debug( 'populating with', roles.global.direct );
                self.PR.triggerChangeEvent = false;
                const $tree = self.PR.$tree.get();
                $tree.jstree( true ).show_checkboxes();
                //$tree.jstree( true ).open_all();
                const prefix = self.PR.pr_prefix.get();
                const wantScoped = Template.currentData().wantScoped === true;
                if( wantScoped ){
                    const scope = Template.currentData().scope;
                    if( scope ){
                        roles.scoped[scope].direct.forEach(( role ) => {
                            const id = prefix+role;
                            $tree.jstree( true ).check_node( id );
                        });
                    }
                } else {
                    roles.global.direct.forEach(( role ) => {
                        const id = prefix+role;
                        $tree.jstree( true ).check_node( id );
                    });
                }
                self.PR.triggerChangeEvent = true;
                // send a pr-change on the tree to leave the status indicator a chance to auto-update
                $tree.trigger( 'pr-change' );
            }
            self.PR.tree_checked( true );
            self.PR.tree_accounts( false );
        }
    });

    // add accounts if any
    self.autorun(() => {
        if( self.PR.tree_checked() && !self.PR.tree_accounts()){
            let accounts = Template.currentData().accounts?.get();
            self.PR.traceBuild && console.debug( 'set accounts', accounts );
            let promises = [];
            if( accounts ){
                const $tree = self.PR.$tree.get();
                const prefix = self.PR.pr_prefix.get();
                const amInstance = AccountsHub.instances['users'];
                // first reset the tree
                ( self.PR.prevAccounts || [] ).forEach(( it ) => {
                    $tree.jstree( true ).delete_node( prefix+it._id );
                });
                // then re-add the accounts members
                accounts.forEach(( it ) => {
                    const node = $tree.jstree( true ).get_node( prefix+it.role._id );
                    if( node ){
                        promises.push( amInstance.preferredLabel( it.user._id ).then(( doc ) => {
                            $tree.jstree( true ).create_node( node, {
                                "id": prefix+it._id,
                                "text": doc.label,
                                "children": [],
                                "doc": it,
                                "type": 'A'
                            });
                            return true;
                        }));
                    } else {
                        console.warn( 'node not found', it );
                    }
                });
            }
            Promise.allSettled( promises ).then(() => {
                self.PR.prevAccounts = _.cloneDeep( accounts );
                self.PR.tree_accounts( true );
                self.PR.tree_built( false );
            });
        }
    });

    // at end, open all nodes
    self.autorun(() => {
        if( self.PR.tree_accounts() && !self.PR.tree_built()){
            self.PR.traceBuild && console.debug( 'open all' );
            const $tree = self.PR.$tree.get();
            $tree.jstree( true ).open_all();
            self.PR.tree_built( true );
        }
    });
});

Template.pr_tree.helpers({
    // name of the main class
    divClass(){
        return this.pr_div;
    }
});

Template.pr_tree.events({
    'pr-delete .pr-tree'( event, instance ){
        //console.debug( 'deleting pr-tree' );
        const $tree = instance.PR.$tree.get();
        if( $tree ){
            $tree.jstree( true ).destroy();
            instance.PR.$tree.set( null );
        }
    }
});
