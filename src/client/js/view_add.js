/*
 * pwix:roles/src/cient/js/view_add.js
 */

/**
 * @summary Let the caller provides a function whose result will be added as a HTML string to the prView content.
 *  This result will be displayed as a distinct tab in the dialog.
 * @locus Client
 * @param {Object} o an object which following keys:
 *  - tabLabel: a function
 *      which will be called with ( tabItem ) argument,
 *      and must return the tab label as a String
 *  - paneContent: a function
 *      which will be called with ( tabItem ) argument,
 *      and must return a Promise which must eventually resolves to the HTML pane content
 */
pwixRoles.viewAdd = function( o ){
    if( pwixRoles._conf.verbosity & PR_VERBOSE_VIEWADD ){
        console.log( 'pwix:roles adding a view callback' );
    }
    if( !Object.keys( pwixRoles._client ).includes( 'viewCbs' )){
        pwixRoles._client.viewCbs = [];
    }
    pwixRoles._client.viewCbs.push( o );
};
