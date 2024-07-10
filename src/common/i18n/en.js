/*
 * pwix:roles/src/common/i18n/en.js
 */

Roles.i18n = {
    ...Roles.i18n,
    ...{
        en: {
            dialogs: {
                cancel: 'Cancel',
                close: 'Close',
                edit_title: 'Edit user\'s roles',
                edit_title_mail: 'Edit roles for %s',
                myroles: 'My roles',
                norole: 'It seems you don\'t have any particular role at the moment.',
                roles_tab: 'Roles',
                save: 'Save',
                view_title: 'View user\'s roles',
                view_title_mail: 'View roles for %s',
            },
            panels: {
                add_button: 'New scope',
                add_title: 'Add a new scope perimeter able to host roles',
                edit_no_scope: 'There is not yet any allowed scoped role.<br />Begin by adding a new scope.',
                remove_scope_confirm: 'You are about to remove the "%s" scope and all its attached roles.<br />Are you sure ?',
                remove_scope_title: 'Scope deletion',
                remove_title: 'Remove all roles on this scope',
                scope_select: 'Select a scope',
                view_no_scope: 'No scoped role has been attributed.'
            },
            tabs: {
                global_title: 'Global roles',
                scoped_title: 'Scoped roles'
            }
        }
    }
};
