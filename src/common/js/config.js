/*
 * pwix:roles/src/common/js/config.js
 */

pwixRoles = {

    /**
     * A reactive data source, only relevant on the client.
     * @locus Client
     * @returns {Object} with the roles of the current logged-in user, as an object with keys:
     *  - id        {String}    the current user identifier
     *  - all       {Array}     all the roles, either directly or indirectly set
     *  - direct    {Array}     only the directly attributed top roles in the hierarchy (after havng removed indirect ones)
     */
    current: function(){
        _current.dep.depend();
        return _current.val;
    },

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
    viewAdd: function( o ){
        console.log( 'pwix:roles adding a view callback' );
        if( !Object.keys( pwixRoles.client ).includes( 'viewCbs' )){
            pwixRoles.client.viewCbs = [];
        }
        pwixRoles.client.viewCbs.push( o );
    }
};
