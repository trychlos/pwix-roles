/*
 * pwix:roles/src/client/js/edit_panel.js
 *
 * Companion functions for prEditPanel
 */

Roles.EditPanel = {
    /**
     * @param {Object} jqTree jQuery object which holds the prTree tree
     * @returns {Array} the list of roles checked in the prEditPanel
     */
    checked( jqTree ){
        let checked = [];
        jqTree.jstree( true ).get_checked_descendants( '#' ).every(( id ) => {
            checked.push( id.replace( 'prtree_', '' ));
            return true;
        });
        const filtered = Roles._filter( checked );
        //console.log( 'checked', checked, 'filtered', filtered );
        return filtered;
    }
};
