/*
 * pwix:roles/src/common/js/configure.js
 */

import _ from 'lodash';

pwixRoles._defaults = {
    roles: {},
    maintainHierarchy: true,
    verbosity: PR_VERBOSE_NONE
};

/**
 * @summary Get/set the package configuration
 *  Should be called *in same terms* both in the client and the server
 * @locus Anywhere
 * @param {Object} o configuration options
 * @returns {Object} the package configuration
 */
pwixRoles.configure = function( o ){
    if( o && _.isObject( o )){
        _.merge( pwixRoles._conf, pwixRoles._defaults, o );
        // be verbose if asked for
        if( pwixRoles._conf.verbosity & PR_VERBOSE_CONFIGURE ){
            console.debug( 'pwix:roles configure() with', o, 'building', pwixRoles._conf );
        }
        if( Meteor.isClient ){
            pwixRoles._client.currentRecompute( Meteor.userId());
        }
    }
    return pwixRoles._conf;
}

_.merge.recursive( pwixRoles._conf, pwixRoles._defaults );
