/*
 * pwix:roles/src/common/i18n/en.js
 */

Roles.i18n = {
    ...Roles.i18n,
    ...{
        en: {
            dialogs: {
                title: 'Edit user\'s roles',
                title_mail: 'Edit roles for %s',
                myroles: 'My roles',
                norole: 'It seems you don\'t have any particular role at the moment.',
                roles_tab: 'Roles',
                cancel: 'Cancel',
                save: 'Save',
                close: 'Close'
            },
            panels: {
                add_button: 'New scope',
                add_title: 'Add a new scope perimeter able to host roles',
                remove_scope_confirm: 'You are about to remove the "%s" scope and all its attached roles.<br />Are you sure ?',
                remove_scope_title: 'Scope deletion',
                remove_title: 'Remove all roles on this scope',
                scope_select: 'Select a scope',
            },
            tabs: {
                global_title: 'Global roles',
                scoped_title: 'Scoped roles'
            }
        }
    }
};
