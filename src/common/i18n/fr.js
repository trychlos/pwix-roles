/*
 * pwix:roles/src/common/i18n/fr.js
 */

Roles.i18n = {
    ...Roles.i18n,
    ...{
        fr: {
            accounts: {
                add: 'Gérer les comptes assignés',
                edit: 'Editer les comptes sur le périmètre',
                remove: 'Enlever ces comptes',
                res_error: 'Une erreur a été détectée lors de la mise à jour. Merci de réessayer ultérieurement',
                res_success: 'L\'assignation des comptes aux rôles a été effectuée avec succès'
            },
            dialogs: {
                cancel: 'Annuler',
                close: 'Fermer',
                edit_title: 'Rôles de l\'utilisateur',
                edit_title_mail: 'Rôles de %s',
                myroles: 'Mes rôles',
                norole: 'Vous n\'avez aucun rôle particulier en ce moment.',
                roles_tab: 'Rôles',
                save: 'Enregistrer',
                scoped_dialog_title: 'Edition des comptes utilisateurs sur le périmètre',
                view_title: 'Visualisation des rôles',
                view_title_mail: 'Visualisation des rôles de %s',
            },
            panels: {
                add_button: 'Nouveau périmètre',
                add_title: 'Ajoute un nouveau périmètre auqle vous pourrez attacher des rôles spécifiques',
                edit_no_scope: 'Aucun rôle n\'est encore attribué sur aucun périmètre.',
                edit_no_scope_add: 'Commencez par ajouter un nouvau périmètre.',
                edit_no_scope_none: 'Aucun périmètre n\'est malheureusement actuellement disponible.',
                remove_scope_confirm: 'Vous êtes sur le point de supprimer le périmètre "%s", ainsi que tous les rôles qui lui sont attachés.<br />Etes-vous sûr ?',
                remove_scope_title: 'Suppression de périmètre',
                remove_title: 'Supprime tous les rôles de ce périmètre',
                scope_select: 'Choisissez un périmètre',
                view_no_global: 'Aucun rôle global n\'a été attribué.',
                view_no_scope: 'Aucun rôle n\'a été attribué sur aucun périmètre.'
            },
            tabs: {
                global_title: 'Rôles globaux',
                scoped_title: 'Rôles périmétrés'
            }
        }
    }
};
