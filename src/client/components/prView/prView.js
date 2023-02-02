/*
 * pwix:roles/src/client/components/prView/prView.js
 *
 * Don't want to use a 'read-only' version of prEdit to not show to the user the roles he/she DOESN'T have...
 * So just show here the roles directly attributed, along with the inherited ones.
 * 
 * If someone has provided any viewCb object, then display their result in tabs.
 * 
 * Parms:
 * - title: (opt) a ReactiveVar which contains the modal title, defaulting to 'My roles'
 */

import { pwixI18n as i18n } from 'meteor/pwix:i18n';

import { v4 as uuidv4 } from 'uuid';

import '../../../common/js/index.js';

import '../../stylesheets/pr_roles.less';

import './prView.html';

Template.prView.onCreated( function(){
    const self = this;

    self.PR = {
        // the predefined tab item
        tabItems: [
            {
                tabId: 'roles_tab',
                tabKey: 'roles_tab',
                paneId: 'roles_pane',
                paneContent( it ){ return self.PR.display( it ); }
            }
        ],

        // the active tab id
        activeTab: new ReactiveVar( 'roles_tab' ),

        // returns the list of current user roles as a HTML hierarchy
        display( tab ){
            let html = '';
            // recurse here
            function f_display( o, level=0 ){
                html += '<li';
                if( level > 0 ){
                    html += ' class="pr-view-inherited"';
                }
                html += '>';
                html += o.name;
                if( o.children ){
                    html += '<ul class="pr-view-items" data-pr-level="'+level+'">';
                    o.children.every(( c ) => {
                        f_display( c, level+1 );
                        return true;
                    });
                    html += '</ul>';
                }
                html += '</li>';
            }
            html += '<ul class="pr-view-roles">';
            pwiRoles.userHierarchy( pwiRoles.current().direct ).every(( o ) => {
                f_display( o );
                return true;
            });
            html += '</ul>';
            return html;
        },

        // get a translated label
        i18n: function( label ){
            return i18n.label( ROLES_I18N, 'dialogs.'+label );
        }
    };

    // increment the tabs with the registered ones
    if( pwiRoles.client.viewCbs ){
        pwiRoles.client.viewCbs.every(( o ) => {
            const uuid = uuidv4();
            let tab = {
                tabId: 'tab-'+uuid,
                tabLabel: o.tabLabel,
                paneId: 'pane-'+uuid,
                paneContent: o.paneContent,
                paneRV: new ReactiveVar( '' )
            };
            self.PR.tabItems.push( tab );
            tab.paneContent( tab ).then(( html ) => { tab.paneRV.set( html )});
            return true;
        });
    }
});

Template.prView.onRendered( function(){
    this.$( '.modal' ).modal( 'show' );
});

Template.prView.helpers({
    // i18n namespace
    namespace(){
        return ROLES_I18N;
    },
    // modal title
    modalTitle(){
        const rv = Template.currentData.title;
        const title = rv ? rv.get() : Template.instance().PR.i18n( 'myroles' );
    },
    // whether the pane is active ?
    paneActive( it ){
        return Template.instance().PR.activeTab.get() === it.tabId ? 'show active' : '';
    },
    // provides the HTML content of the pane
    paneContent( it ){
        return it.paneRV ? it.paneRV.get() : ( it.paneContent ? it.paneContent( it ) : '' );
    },
    // whether the tab is active ?
    tabActive( it ){
        return Template.instance().PR.activeTab.get() === it.tabId ? 'active' : '';
    },
    // returns the list of tabs
    tabItems(){
        return Template.instance().PR.tabItems;
    },
    // the tab label
    tabLabel( it ){
        if( it.tabLabel ){
            return it.tabLabel( it );
        }
        if( it.tabKey ){
            return Template.instance().PR.i18n( it.tabKey );
        }
    },
    // the aria label for an active tab
    tabSelected( it ){
        return Template.instance().PR.activeTab.get() === it.tabId ? 'true' : 'false';
    },
});

Template.prView.events({

    // remove the Blaze element from the DOM
    'hidden.bs.modal .prView'( event, instance ){
        Blaze.remove( instance.view );
    }
});
