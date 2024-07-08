/*
 * pwix:roles/src/common/i18n/fr.js
 */

Roles.i18n = {
    ...Roles.i18n,
    ...{
        fr: {
            dialogs: {
                title: 'Rôles de l\'utilisateur',
                title_mail: 'Rôles de %s',
                myroles: 'Mes rôles',
                norole: 'Vous n\'avez aucun rôle particulier en ce moment.',
                roles_tab: 'Rôles',
                cancel: 'Annuler',
                save: 'Enregistrer',
                close: 'Fermer'
            },
            panels: {
                add_button: 'Nouveau périmètre',
                add_title: 'Ajoute un nouveau périmètre auqle vous pourrez attacher des rôles spécifiques',
                remove_scope_confirm: 'Vous êtes sur le point de supprimer le périmètre "%s", ainsi que tous les rôles qui lui sont attachés.<br />Etes-vous sûr ?',
                remove_scope_title: 'Suppression de périmètre',
                remove_title: 'Supprime tous les rôles de ce périmètre',
                scope_select: 'Choisissez un périmètre',
            },
            tabs: {
                global_title: 'Rôles globaux',
                scoped_title: 'Rôles périmétrés'
            }
        }
    }
};
