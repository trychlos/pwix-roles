/*
 * pwix:roles/src/common/js/defaults.js
 */

defaults = {
    conf: {
        verbose: PR_VERBOSE_NONE
    }
};

pwiRoles.conf = {
    ...pwiRoles.conf,
    ...defaults.conf
};
