/*
 * pwix:roles/src/common/js/defaults.js
 */

defaults = {
    conf: {
        verbose: PR_VERBOSE_NONE
    }
};

pwixRoles.conf = {
    ...pwixRoles.conf,
    ...defaults.conf
};
