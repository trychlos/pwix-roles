/*
 * pwix:roles/src/common/js/constants.js
 */

pwixRoles.C = {
    // verbosity levels
    Verbose: {
        NONE: 0,
        CONFIGURE: 0x01 << 0,
        MAINTAIN:  0x01 << 1,
        STARTUP:   0x01 << 2,
        READY:     0x01 << 3,
        CURRENT:   0x01 << 4,
        VIEWADD:   0x01 << 5
    }
};

// non exported

PACKAGE_NAME = 'pwix:roles';

I18N = PACKAGE_NAME + ':i18n';
