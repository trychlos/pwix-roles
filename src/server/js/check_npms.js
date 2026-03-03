/*
 * pwix:roles/src/server/js/check_npms.js
 */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if( false ){
    require( 'uuid/package.json' );
    require( '@tacman1123/jstree-esm/package.json' );
}

checkNpmVersions({
    '@tacman1123/jstree-esm': '^4.0.0',
    'lodash': '^4.17.0',
    'uuid': '^9.0.0 || ^10.0.0 || ^11.0.0'
},
    'pwix:roles'
);
