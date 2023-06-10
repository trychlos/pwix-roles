/*
 * pwix:roles/src/client/components/prView/prView.js
 *
 * Don't want to use a 'read-only' version of prEdit to not show to the user the roles he/she DOESN'T have...
 * So just show here the roles directly attributed, along with the inherited ones.
 * 
 * If the caller has provided any viewCb object, then display their result in tabs.
 * 
 * Parms:
 * - title: (opt) a ReactiveVar which contains the modal title, defaulting to 'My roles'
 */

import { pwixI18n } from 'meteor/pwix:i18n';
import { pwixModal } from 'meteor/pwix:modal';

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

        // modal title (expected to be a ReactiveVar if provided)
        title: null,

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
            let count = 0;
            html += '<ul class="pr-view-roles">';
            console.debug( pwixRoles.current());
            pwixRoles.userHierarchy( pwixRoles.current().direct ).every(( o ) => {
                f_display( o );
                count += 1;
                return true;
            });
            html += '</ul>';
            if( !count ){
                html = '<p class="">';
                html += pwixI18n.label( I18N, 'dialogs.norole' );
                html += '</p>'
            }
            return html;
        }
    };

    // increment the tabs with the registered ones
    if( pwixRoles._client.viewCbs ){
        pwixRoles._client.viewCbs.every(( o ) => {
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

    // get the title
    self.autorun(() => {
        const title = Template.currentData().title;
        if( title ){
            self.PR.title = title;
        }
    });
});

Template.prView.onRendered( function(){
    const self = this;

    pwixModal.run({
        mdBody: 'prView_body',
        mdFooter: 'prView_footer',
        PR: self.PR
    });

    let title = pwixI18n.label( I18N, 'dialogs.myroles' );

    self.autorun(() => {
        if( self.PR.title ){
            title = self.PR.title.get();
        }
        pwixModal.setTitle( title );
    });
});

Template.prView_body.helpers({

    // whether the pane is active ?
    paneActive( it ){
        const PR = Template.currentData().PR;
        return PR.activeTab.get() === it.tabId ? 'show active' : '';
    },

    // provides the HTML content of the pane
    paneContent( it ){
        return it.paneRV ? it.paneRV.get() : ( it.paneContent ? it.paneContent( it ) : '' );
    },

    // whether the tab is active ?
    tabActive( it ){
        const PR = Template.currentData().PR;
        return PR.activeTab.get() === it.tabId ? 'active' : '';
    },

    // returns the list of tabs
    tabItems(){
        const PR = Template.currentData().PR;
        return PR.tabItems;
    },

    // the tab label
    tabLabel( it ){
        if( it.tabLabel ){
            return it.tabLabel( it );
        }
        if( it.tabKey ){
            return pwixI18n.label( I18N, 'dialogs.'+it.tabKey );
        }
    },

    // the aria label for an active tab
    tabSelected( it ){
        const PR = Template.currentData().PR;
        return PR.activeTab.get() === it.tabId ? 'true' : 'false';
    }
});

Template.prView_footer.helpers({
    // i18n
    i18n( opts ){
        return pwixI18n.label( I18N, opts.hash.key );
    }
});
