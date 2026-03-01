/*
 * pwix:roles/src/common/js/configure.js
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { ReactiveVar } from 'meteor/reactive-var';

const logger = Logger.get();

let _conf = {};
Roles._conf = new ReactiveVar( _conf );

Roles._defaults = {
    allowFn: null,
    assignmentsCollection: 'role-assignment',
    maintainHierarchy: true,
    roles: {},
    scopeLabelFn: null,
    scopesFn: null,
    scopesPub: null,
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
        // check that keys exist
        let built_conf = {};
        Object.keys( o ).forEach(( it ) => {
            if( Object.keys( Roles._defaults ).includes( it )){
                built_conf[it] = o[it];
            } else {
                logger.warn( 'configure() ignore unmanaged key \''+it+'\'' );
            }
        });
        if( Object.keys( built_conf ).length ){
            _conf = _.merge( Roles._defaults, _conf, built_conf );
            Roles._conf.set( _conf );
            logger.verbose({ verbosity: _conf.verbosity, against: Roles.C.Verbose.CONFIGURE }, 'configure() with', built_conf );
        }
    }
    // also acts as a getter
    return Roles._conf.get();
}

_conf = _.merge( {}, Roles._defaults );
Roles._conf.set( _conf );
