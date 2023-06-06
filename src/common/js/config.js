/*
 * pwix:roles/src/common/js/config.js
 */

import { Tracker } from 'meteor/tracker';

//console.log( 'pwix:roles/src/common/config.js defining globally exported pwixRoles object' );

// available both in the client and the server
//  while only relevant on the client (always true on the server)
_ready = {
    dep: new Tracker.Dependency(),
    val: false
};

// only available on the client
_current = {
    dep: new Tracker.Dependency(),
    val: {
        id: '',
        all: [],
        direct: []
    }
};

pwixRoles = {

    // client-specific data and functions
    client: {
    },

    conf: {
        roles: {}       // described in README.md
    },

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
     * @summary A reactive data source, only relevant on the client.
     *  Returned value is updated at package client startup.
     * @locus Client
     * @returns {Boolean} true when the package is ready
     */
    ready: function(){
        _ready.dep.depend();
        return _ready.val;
    },

    // server-specific data and functions
    server: {},

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
