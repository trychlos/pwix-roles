/*
 * pwix:roles/src/server/js/check_npms.js
 */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if( false ){
}

checkNpmVersions({
    'deep-equal': '^2.2.0',
    'merge': '^2.1.1',
    'uuid': '^9.0.0'
},
    'pwix:roles'
);
