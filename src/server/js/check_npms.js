/*
 * pwix:roles/src/server/js/check_npms.js
 */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if( false ){
    require( '@popperjs/core/package.json' );
    require( 'bootstrap/package.json' );
    require( 'jstree/package.json' );
}

checkNpmVersions({
    '@popperjs/core': '^2.11.6',
    bootstrap: '^5.2.1',
    'deep-equal': '^2.2.0',
    jstree: '^3.3.12',
    uuid: '^9.0.0'
}, 'pwix:roles' );
