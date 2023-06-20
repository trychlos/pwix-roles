/*
 * pwix:roles/src/common/js/i18n.js
 */

import { pwixI18n } from 'meteor/pwix:i18n';

import '../i18n/en_US.js';
pwixI18n.namespace( I18N, 'en', pwixRoles.i18n.en_US );

import '../i18n/fr_FR.js';
pwixI18n.namespace( I18N, 'fr', pwixRoles.i18n.fr_FR );

/**
 * @locus Anywhere
 * @returns {String} the i18n namespace of this package
 */
pwixRoles.i18n.namespace = function(){
    return I18N;
}
