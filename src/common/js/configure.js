/*
 * pwix:roles/src/common/js/configure.js
 */

import merge from 'merge';

pwixRoles._defaults = {
    roles: [],
    verbosity: PR_VERBOSE_NONE
};

pwixRoles.configure = function( o ){
    pwixRoles._conf = merge.recursive( true, pwixRoles._defaults, o );

    // be verbose if asked for
    if( pwixRoles._conf.verbosity & PR_VERBOSE_CONFIGURE ){
        console.debug( 'pwix:roles configure() with', o, 'building', pwixRoles._conf );
    }
}

pwixRoles._conf = merge.recursive( true, pwixRoles._defaults );
