/*
 * pwix:roles/src/server/js/check_npms.js
 */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if( false ){
    require( 'uuid/package.json' );
}

checkNpmVersions({
    'lodash': '^4.17.0',
    'uuid': '^9.0.0'
},
    'pwix:roles'
);
