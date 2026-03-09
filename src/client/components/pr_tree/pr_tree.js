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
 *  - pr_editable: whether we want be able to edit, defaulting to true
 *  - pr_selectable: whether we want be able to select rows, defaulting to true
 *  - pr_multiple: whether we can select multiple rows, defaulting to false
 *  - withCheckboxes: whether to display a checkbox in front of each role, defaulting to true
 *  - accounts: an optional ReactiveVar which contains the array of accounts assignments from 'role-assignment' collection
 *    let you edit the accounts to who each role is assigned
 * 
 * Triggers:
 * - pr-change
 * - pr-rowselect
 */

import _ from 'lodash';
import { createTree, getTree, callTree, destroyTree } from '@tacman1123/jstree-esm';

import { AccountsHub } from 'meteor/pwix:accounts-hub';
import { Logger } from 'meteor/pwix:logger';

import './pr_tree.html';

const logger = Logger.get();

Template.pr_tree.onCreated( function(){
    const self = this;

    self.PR = {
        // whether to trace each step of the tree build
        traceBuild: false,
        // whether to be verbose when a status changes
        traceStatus: false,
        // the DOM element on which the tree is built
        //  we have to keep it in order to be able to trigger events
        tree: null,
        // the jsTree instance
        //  the most reliable to interact with jsTree
        jsTreeInstance: null,
        tree_nodes_asked: {},
        tree_nodes_created: {},
        tree_nodes_waiting: {},
        // the tree is first ready, then successively populated, checked, accounts, and built
        tree_ready_rv: new ReactiveVar( false ),
        tree_populated_rv: new ReactiveVar( false ),
        tree_checked_rv: new ReactiveVar( false ),
        tree_accounts_rv: new ReactiveVar( false ),
        tree_built_rv: new ReactiveVar( false ),
        // a prefix for node identifiers
        pr_prefix: new ReactiveVar( '' ),
        // icons are only displayed when we manage roles AND accounts
        withIcons: new ReactiveVar( false ),

        // whether the tree is readonly
        editable: new ReactiveVar( false ),

        // whether the rows are selectable
        selectable: new ReactiveVar( true ),

        // whether the user can select multiple rows
        multiple: new ReactiveVar( false ),

        // whether we want checkboxes
        haveCheckboxes: new ReactiveVar( true ),

        // last built and populated roles tree 
        prevTree: null,

        // last and last-but-one built and populated accounts members
        prevAccounts: null,
        accountsBuildSeq: 0,

        // whether trigger pr-change event
        //  doesn't trigger the event when checkboxes are programatically checked
        triggerChangeEvent: true,

        // disable roles children
        disableChildrenById( id ){
            const child = self.PR.jsTreeInstance.get_node( self.PR.pr_prefix.get()+id );
            self.PR.disableChildrenByNode( child );
        },

        // disable roles children
        disableChildrenByNode( node ){
            if( node ){
                node.children_d.forEach(( id ) => {
                    self.PR.jsTreeInstance.disable_node( id );
                });
            }
        },

        // getter/setter: whether the creation of the accounts is done (if apply)
        tree_accounts( done ){
            if( done === true || done === false ){
                self.PR.tree_accounts_rv.set( done );
            }
            return self.PR.tree_accounts_rv.get();
        },

        // we have explicitely or programatically checked an item (but cascade doesn't come here)
        //  data = { node, selected, event, jsTree instance }
        // note too that the event is not triggered when editable is false
        tree_checkbox_check( data ){
            self.PR.disableChildrenByNode( data.node );
            if( self.PR.triggerChangeEvent ){
                //logger.debug( 'triggering pr-change due to checkbox check' );
                self.$( self.PR.tree ).trigger( 'pr-change' );
            }
        },

        // we have explicitely or programatically unchecked an item (but cascade doesn't come here)
        //  data = { node, selected, event, jsTree instance }
        tree_checkbox_uncheck( data ){
            data.node.children_d.forEach(( id ) => {
                self.PR.jsTreeInstance.enable_node( id );
            });
            //logger.debug( 'triggering pr-change due to checkbox uncheck' );
            self.$( self.PR.tree ).trigger( 'pr-change' );
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
            if( data.node.type === 'R' ){
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
            }
        },

        // create a new node
        //  the caller has made sure the parent is available if not null
        tree_create_node( role, parent=null ){
            self.PR.tree_nodes_asked[role.name] = role;
            const parent_node = parent ? self.PR.tree_nodes_created[ parent.name ] : null;
            self.PR.jsTreeInstance.create_node( parent_node, {
                "id": self.PR.pr_prefix.get() + role.name,
                "text": role.name,
                "children": [],
                "icon": self.PR.withIcons.get(),
                "doc": role,
                "type": 'R',
                "li_attr": {
                    class: self.PR.editable.get() ? 'pr-editable-true' : 'pr-editable-false'
                }
            });
        },

        // delete a node
        //  a node has been deleted
        //  seems that deletion is sync
        tree_delete_node( data ){
            //logger.debug( 'tree_delete_node', data );
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

        // jsTree add to its root node a class as 'jstree-n'
        // from our point of view, this acts as a jstree identifier which can help us debug the code
        tree_id(){
            let id = '';
            if( self.PR.tree ){
                const classes = self.PR.tree.className.split( /\s+/ );
                classes.every(( it ) => {
                    if( it.match( /^jstree-[\d]+/ )){
                        id = it.substring( 7 );
                        return false;
                    }
                    return true;
                });
            }
            return id;
        },

        // debounce the rebuilts on accounts changes
        tree_invalidate: _.debounce(() => {
            self.PR.tree_accounts( false );
            //logger.debug( 'setting tree_accounts to false', self.PR.tree_id());
        }, 10 ),

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
        self.PR.editable.set( Template.currentData().pr_editable !== false );
    });

    // setup the selectable flag
    self.autorun(() => {
        self.PR.selectable.set( Template.currentData().pr_selectable !== false );
    });

    // setup the checkboxes flag
    self.autorun(() => {
        self.PR.haveCheckboxes.set( Template.currentData().withCheckboxes !== false );
    });

    // setup the multiple flag
    self.autorun(() => {
        self.PR.multiple.set( Template.currentData().pr_multiple === true );
    });

    // make sure roles are set as a ReactiveVar
    // track the received roles -> have to rebuild the tree on changes
    self.autorun(() => {
        const rolesRv = Template.currentData().roles;
        if( !rolesRv || !( rolesRv instanceof ReactiveVar )){
            logger.error( 'expects \'roles\' be an instance of ReactiveVar, got', rolesRv, 'throwing...' );
            throw new Error( 'Bad argument: rolesRv' );
        }
        const roles = rolesRv.get();
        if( !_.isEqual( roles, self.PR.prevTree )){
            self.PR.prevTree = _.cloneDeep( roles );
            self.PR.traceBuild && logger.debug( 'roles has changed, re-populating tree' );
            self.PR.tree_populated( false );
        }
    });

    // if accounts are provided, make sure it is a ReactiveVar
    // track the received accounts -> have to rebuild the accounts members on changes
    self.autorun(() => {
        const accountsRv = Template.currentData().accounts;
        if( accountsRv ){
            if( !( accountsRv instanceof ReactiveVar )){
                logger.error( 'expects \'accounts\' be an instance of ReactiveVar, got', accountsRv, 'throwing...' );
                throw new Error( 'Bad argument: accountsRv' );
            }
            self.PR.withIcons.set( true );
            const accounts = accountsRv.get();
            if( accounts && !_.isEqual( accounts, self.PR.prevAccounts )){
                //logger.debug( 'invalidating tree accounts' );
                self.PR.tree_invalidate();
            }
        }
    });

    // track the ready status
    self.autorun(() => {
        self.PR.traceStatus && logger.debug( 'tree_ready', self.PR.tree_ready());
    });

    // track the populated status
    self.autorun(() => {
        self.PR.traceStatus && logger.debug( 'tree_populated', self.PR.tree_populated());
    });

    // track the checked status
    self.autorun(() => {
        self.PR.traceStatus && logger.debug( 'tree_checked', self.PR.tree_checked());
    });

    // track the accounts status
    self.autorun(() => {
        self.PR.traceStatus && logger.debug( 'tree_accounts', self.PR.tree_accounts());
    });

    // track the built status
    self.autorun(() => {
        self.PR.traceStatus && logger.debug( 'tree_built', self.PR.tree_built());
    });
});

Template.pr_tree.onRendered( function(){
    const self = this;

    // identify the tree node as soon as possible
    // in an autorun because we use Template.currentData() data context, but the tree root DOM Element itself is not expected to be reactive
    self.autorun(() => {
        if( !self.PR.jsTreeInstance ){
            const $tree = self.$( '.'+Template.currentData().pr_div );
            if( $tree.length ){
                const tree = $tree[0];
                // types are always defined, but only used when managing accounts assignments
                //  in this case only, we show type icons
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
                self.PR.traceBuild && logger.debug( 'creating tree' );
                if( self.PR.haveCheckboxes.get()){
                    plugins.push( 'checkbox' );
                }
                createTree( tree, {
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
                        multiple: self.PR.multiple.get(),
                    },
                    plugins: plugins,
                    checkbox: {
                        three_state: false,
                        cascade: 'down',
                        whole_node: true,
                        tie_selection: !self.PR.editable.get(), // false
                        keep_selected_style: !self.PR.editable.get()
                    },
                    // node is the last selected node whose selection triggers this event
                    //  at the time, get_selected() returns the already/previously selected nodes
                    //  so the whole selection is the union of node + get_selected()
                    // allow only one selected role, or several accounts
                    conditionalselect( node, event ){
                        if( !self.PR.selectable.get()){
                            return false;
                        }
                        if( !self.PR.multiple.get()){
                            return true;
                        }
                        if( node.type === 'R' ){
                            self.PR.jsTreeInstance.deselect_all();
                            return true;
                        }
                        let haveRole = false;
                        self.PR.jsTreeInstance.get_selected( true ).every(( it ) => {
                            if( it.type === 'R' ){
                                haveRole = true;
                            }
                            return !haveRole;
                        });
                        if( haveRole ){
                            self.PR.jsTreeInstance.deselect_all();
                            return true;
                        }
                        return true;
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
                });
                // events are CustomEvent instances where data is in 'event.detail' object
                tree.addEventListener( 'jstree:ready', ( event ) => {
                    self.PR.tree_ready( true );
                });
                // 'create_node.jstree' detail = { node, parent, position, jsTree instance }
                tree.addEventListener( 'jstree:create_node', ( event ) => {
                    self.PR.tree_create_done( event.detail );
                });
                // 'check_node.jstree' data = { node, selected, event, jsTree instance }
                tree.addEventListener( 'jstree:check_node', ( event ) => {
                    self.PR.tree_checkbox_check( event.detail );
                });
                // 'uncheck_node.jstree' data = { node, selected, event, jsTree instance }
                tree.addEventListener( 'jstree:uncheck_node', ( event ) => {
                    self.PR.tree_checkbox_uncheck( event.detail );
                });
                // 'delete_node.jstree' data = { node, parent, jsTree instance }
                tree.addEventListener( 'jstree:delete_node', ( event ) => {
                    self.PR.tree_delete_node( event.detail );
                });
                // 'enable_checkbox.jstree' data = { node, jsTree instance }
                tree.addEventListener( 'jstree:enable_node', ( event ) => {
                    self.PR.jsTreeInstance.get_node( event.detail.node.id, true ).removeClass( 'pr-disabled' );
                });
                // 'disable_checkbox.jstree' data = { node, jsTree instance }
                tree.addEventListener( 'jstree:disable_node', ( event ) => {
                    self.PR.jsTreeInstance.get_node( event.detail.node.id, true ).addClass( 'pr-disabled' );
                });
                // 'select_node.jstree' data = { node, jsTree instance }
                tree.addEventListener( 'jstree:select_node', ( event, data ) => {
                    const selected = self.PR.jsTreeInstance.get_selected( true );
                    self.PR.traceStatus && logger.debug( 'selected', selected );
                    self.$( tree ).trigger( 'pr-rowselect', { node: event.detail.node, selected: selected });
                });
                // end of initialization: time to setup the tree vars: the jsTree instance and DOM Element which holds this tree
                self.PR.tree = tree;
                self.PR.jsTreeInstance = getTree( tree );
            }
        }
    })

    // populate the roles tree
    //  displaying the roles hierarchy that the current user is allowed to give to someone else
    //  we build here the structure opened to the user roles
    //  the built structure includes all the roles the current user has
    self.autorun(() => {
        const jsTreeInstance = self.PR.jsTreeInstance;
        const roles = Template.currentData().roles.get();
        if( jsTreeInstance && self.PR.tree_ready() && !self.PR.tree_populated() && roles ){
            self.PR.traceBuild && logger.debug( 'populate the tree', Template.currentData().pr_div, roles );
            // reset the tree
            jsTreeInstance.delete_node( Object.values( self.PR.tree_nodes_created ));
            self.PR.tree_nodes_asked = {};
            self.PR.tree_nodes_created = {};
            self.PR.tree_nodes_waiting = {};
            // and rebuild it
            const wantScoped = Template.currentData().wantScoped === true;
            let promises = [];
            // display the role and its children if:
            //  - role is global or scoped depending of wantScoped
            //  - the current user has it which means he is allowed to give it
            const askToCreateNodeFn = self.PR.tree_create_ask.bind( self );
            async function f_role( role, parent=null, scoped=false ){
                Roles.userIsInRoles( Meteor.userId(), role.name, { anyScope: true }).then(( res ) => {
                    //logger.debug( role.name, res );
                    if( res && (( wantScoped && ( role.scoped === true || scoped === true )) || ( !wantScoped && !role.scoped && !scoped ))){
                        askToCreateNodeFn( role, parent );
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
        const jsTreeInstance = self.PR.jsTreeInstance;
        if( jsTreeInstance && self.PR.tree_populated() && !self.PR.tree_checked()){
            const haveCheckboxes = self.PR.haveCheckboxes.get();
            self.PR.traceBuild && logger.debug( 'set checkboxes', haveCheckboxes );
            if( haveCheckboxes ){
                //logger.debug( 'populating with', roles.global.direct );
                self.PR.triggerChangeEvent = false;
                jsTreeInstance.show_checkboxes();
                const prefix = self.PR.pr_prefix.get();
                const wantScoped = Template.currentData().wantScoped === true;
                if( wantScoped ){
                    const scope = Template.currentData().scope;
                    if( scope ){
                        roles.scoped[scope].direct.forEach(( role ) => {
                            const id = prefix+role;
                            jsTreeInstance.check_node( id );
                        });
                    }
                } else {
                    roles.global.direct.forEach(( role ) => {
                        const id = prefix+role;
                        jsTreeInstance.check_node( id );
                    });
                }
                self.PR.triggerChangeEvent = true;
                // send a pr-change on the tree to leave the status indicator a chance to auto-update
                self.$( self.PR.tree ).trigger( 'pr-change' );
            }
            self.PR.tree_checked( true );
            self.PR.tree_accounts( false );
        }
    });

    // when we have read-only checkboxes, have to explicitely disable children because the check_node event is not triggered in this case
    self.autorun(() => {
        if( self.PR.tree_checked() && self.PR.haveCheckboxes.get() && !self.PR.editable.get()){
            const wantScoped = Template.currentData().wantScoped === true;
            const roles = Template.currentData().roles.get();
            if( wantScoped ){
                const scope = Template.currentData().scope;
                if( scope ){
                    roles.scoped[scope].direct.forEach(( role ) => {
                        self.PR.disableChildrenById( role );
                    });
                }
            } else {
                roles.global.direct.forEach(( role ) => {
                    self.PR.disableChildrenById( role );
                });
            }
        }
    });

    // add accounts if any
    self.autorun(() => {
        const jsTreeInstance = self.PR.jsTreeInstance;
        if( jsTreeInstance && self.PR.tree_checked() && !self.PR.tree_accounts()){
            const seq = ++self.PR.accountsBuildSeq;
            const accounts = Template.currentData().accounts?.get() || [];
            const prefix = self.PR.pr_prefix.get();
            const amInstance = AccountsHub.getInstance('users');
            self.PR.traceBuild && logger.debug( 'set accounts', accounts );
            // delete previous account nodes
            ( self.PR.prevAccounts || [] ).forEach(( it ) => {
                //logger.debug( 'about to delete node', self.PR.tree_id(), it._id, it.role._id );
                jsTreeInstance.delete_node( prefix + it._id );
            });
            self.PR.prevAccounts = [];
            // then re-add the accounts members
            //logger.debug( 're-adding the accounts', self.PR.tree_id());
            Promise.all( accounts.map( async ( it ) => {
                const parent = jsTreeInstance.get_node( prefix+it.role._id );
                if( !parent ){
                    logger.warn( 'parent role not found', self.PR.tree_id(), it );
                } else {
                    const doc = await amInstance.preferredLabel( it.user._id );
                    // stale build? abort
                    if( seq !== self.PR.accountsBuildSeq || !self.PR.jsTreeInstance || !self.PR.tree ){
                        return;
                    }
                    jsTreeInstance.create_node( parent, {
                        "id": prefix+it._id,
                        "text": doc.label,
                        "children": [],
                        "doc": it,
                        "type": 'A'
                    });
                    //logger.debug( 'create_node', self.PR.tree_id(), it._id, it.role._id, doc.label );
                }
            })).then(() => {
                if( seq !== self.PR.accountsBuildSeq || !self.PR.jsTreeInstance || !self.PR.tree ){
                    return;
                }
                //logger.debug( 'promises all settled', self.PR.tree_id());
                self.PR.prevAccounts = _.cloneDeep( accounts );
                self.PR.tree_accounts( true );
                self.PR.tree_built( false );
            });
        }
    });

    // at end, open all nodes
    self.autorun(() => {
        const jsTreeInstance = self.PR.jsTreeInstance;
        if( jsTreeInstance && self.PR.tree_accounts() && !self.PR.tree_built()){
            self.PR.traceBuild && logger.debug( 'open all' );
            jsTreeInstance.open_all();
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
        instance.PR.traceBuild && logger.debug( 'deleting pr-tree' );
        if( instance.PR.tree ){
            destroyTree( instance.PR.tree );
            instance.PR.tree = null;
            instance.PR.jsTreeInstance = null;
        }
    },

    // this tree will be destroyed sooner - no need to auto update
    'pr-on-destroy .pr-tree'( event, instance ){
        instance.PR.traceBuild && logger.debug( 'pr-tree on destroy' );
        if( instance.PR.tree ){
            destroyTree( instance.PR.tree );
            instance.PR.tree = null;
            instance.PR.jsTreeInstance = null;
        }
    }
});

Template.pr_tree.onDestroyed( function(){
    //logger.debug( 'onDestroyed()', this.PR.tree_id());
});
