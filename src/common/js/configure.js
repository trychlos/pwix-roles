/*
 * pwix:roles/src/common/js/configure.js
 */

import _ from 'lodash';

Roles._conf = {};

Roles._defaults = {
    roles: {},
    maintainHierarchy: true,
    verbosity: Roles.C.Verbose.NONE
};

/**
 * @summary Get/set the package configuration
 *  Should be called *in same terms* both in the client and the server
 * @locus Anywhere
 * @param {Object} o configuration options
 * @returns {Object} the package configuration
 */
Roles.configure = function( o ){
    if( o && _.isObject( o )){
        _.merge( Roles._conf, Roles._defaults, o );
        // be verbose if asked for
        if( Roles._conf.verbosity & Roles.C.Verbose.CONFIGURE ){
            //console.debug( 'pwix:roles configure() with', o, 'building', Roles._conf );
            console.debug( 'pwix:roles configure() with', o );
        }
        if( Meteor.isClient ){
            Roles._client.currentRecompute( Meteor.userId());
        }
    }
    return Roles._conf;
}

_.merge( Roles._conf, Roles._defaults );
