/*
 * pwix:roles/src/common/js/configure.js
 */

import _ from 'lodash';

import { ReactiveVar } from 'meteor/reactive-var';

let _conf = {};

Roles._conf = new ReactiveVar( _conf );

Roles._defaults = {
    roles: {},
    maintainHierarchy: true,
    scopeLabelFn: null,
    scopesFn: null,
    verbosity: Roles.C.Verbose.CONFIGURE
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
        _.merge( _conf, Roles._defaults, o );
        Roles._conf.set( _conf );
        _verbose( Roles.C.Verbose.CONFIGURE, 'pwix:roles configure() with', o );
    }
    return Roles._conf.get();
}

_.merge( _conf, Roles._defaults );
Roles._conf.set( _conf );
