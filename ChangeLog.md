# pwix:roles

## ChangeLog

### 1.10.0

    Release date: 2026- 5- 2

    - Define new 'hasScopedRole()' function
    - Deprecate Roles.allRolesForUser() in favor of Roles.getUserRoles()
    - Obsolete unused Roles.getUsersInScope()
    - Obsolete unused Roles.removeUserAssignmentsFromRoles()

### 1.9.0

    Release date: 2026- 4-24

    - configure() now warns for unmanaged keys
    - Guard against absent jstree() plugin
    - Use pwix:logger universal logger, thus bumping minor candidate version number
    - Fix permissions of the publications
    - Deprecate Roles.directRolesForUser() and pwix.Roles.m.getRolesForUser() to the advantage of new pwix.Roles.m.allRolesForUser()
    - Set a guard when calling $tree.jstree()
    - Migrate from vakata/jstree to @tacman1123/jstree-esm
    - Fix the stylesheet to let the tree be scrollable
    - Fix both server function and client subscription to decrease the streaming noise (thanks to ChatGPT for some suggestions)
    - Update to pwix:modal v2.5
    - Make sure methods and publications are prefixed with a full namespace
    - Define new scopesCollection configuration parameter
    - Rename pwix:accounts-hub dependency to pwix:accounts-core
    - Add meteor/check dependency
    - Add pwix:forms weak dependency
    - Add guards to limit rebuilts to only those which are useful
    - Scopes view and edition are case-insensitively sorted
    - Install a 'My roles' menu item when the user is logged-in unless configured otherwise

### 1.8.0

    Release date: 2026- 2-10

    - Rename internal Roles._scopes to Roles.scopes
    - Extend uuid dependency to v11.0.0, thus bumping minor candidate version number
    - Remove debug code
    - Update to new AccountsHub.getInstance() reactive function
    - Fix the initial publication name

### 1.7.0

    Release date: 2024-11-19

    - Define new prScopedAccountsPanel component, thus bumping minor candidate version number
    - Fix 'pwix_roles_count_by_roles' publication when an account has redondant assignments
    - Fix the stylesheet to make the tree scrollable
    - Allow multiple account assignements selection
    - No more allow checboxes changes on view mode
    - No more leave an empty prView div after roles view

### 1.6.2

    Release date: 2024-10- 4

    - Improve pr_edit_scoped_plus stylesheet
    - Fix tab activation when showing the 'new scope' button
    - Fix global roles edition
    - Fix some calls to new alanning:roles v4
    - Fix configuration overrides

### 1.6.1

    Release date: 2024- 9-20

    - Accept uuid v10
    - Replace alanning:roles client subscription feature obsoleted in v4.0.0

### 1.6.0

    Release date: 2024- 9-13

    - Protect against unconnected user
    - Define the set of CRUD actions, alogn with a allowFn() configuration parameter, and a Roles.isAllowed() new function, bumping minor candidate version number
    - Define Roles.suggestedPermissions() new function
    - Define Roles.compareLevels() new function
    - Reinit scopes before reloading them
    - Have distinct behavior when no scoped role depending of whether there are available scopes
    - Have an information message when there is no attributed global role
    - Upgrade pwix:tabbed to v 1.3.0

### 1.5.0

    Release date: 2024- 7-12

    - Define pwix.Roles.m.usedScopes() new function, bumping minor candidate version number
    - Roles.configure() becomes a reactive data source
    - Introduce trace module
    - Introduce 'pr-global-state' new event
    - Define Roles.scopedRoles() new function
    - Add missing pwix:ui-utils and ui-fontawesome6 dependencies
    - Add scopeLabelFn, scopesFn and scopesPub configuration parameters to get known scopes
    - Define Roles.EditPanel.global(), .scoped() and .roles() function to get back the edition results
    - Define pwix.Roles.m.setUserRoles() new function
    - Obsolete and remove Roles.allAssignments publication
    - Roles.countByRole publication is renamed to pwix_roles_count_by_roles for consistency, and publishes in a collection of the same name

### 1.4.0

    Release date: 2024- 6-11

    - Replace bootstrap NPM dependency with a package dependency on pwix:ui-ui-bootstrap5
    - Add (missing) tracker dependency
    - Obsolete pwix.Roles.m.removeUserAssignmentsForRoles() function, replaced with pwix.Roles.m.removeUserAssignmentsFromRoles()
    - Obsolete pwix.Roles.m.removeAllRolesFromUser() function, replaced with pwix.Roles.m.removeAssignedRolesFromUser()
    - Use async versions of last alanning:roles release

### 1.3.1

    Release date: 2024- 6- 8

    - Upgrade pwix:modal dependency
    - Add missing bootstrap NPM dependency

### 1.3.0

    Release date: 2024- 5-29

    - Define getUsersInScope() function, callable from both client and server side
    - prView: let the caller provide its own data context
    - Exposes prEditPanel to be able to update the roles from inside an application view (thus bumping candidate version number)
    - Define the pr-change event on permissions edition
    - Define Roles.flat() new function
    - Define pwix.Roles.m.removeAllRolesFromUser() new function
    - Define pwix.Roles.m.addUsersToRoles() new function
    - Define pwix.Roles.m.getRolesForUser() new function
    - Fix the the prView selector in the stylesheet
    - Roles.current() now tracks the role whatever be the scope
    - Let a role be used several times inside of the roles hierarchy
    - Define new Role.isRoleScoped() function
    - Improve Roles.current() content, adding scoped and globals categories
    - Define new pwix.Roles.m.removeUserAssignmentsForRoles() function
    - Meteor 3.0 ready
    - Deprecate deanius:promise package

### 1.2.0

    Release date: 2023-10-11

    - Define new Roles.countByRole() publication (bumping candidate version number)
    - Reorganize constants definitions to not pollute global space
    - Bump version requirements Meteor@2.13.2, pwix:i18n@1.5.2, pwix:modal@1.7.1
    - prEdit: fix clickability on disabled nodes
    - prEdit: make sure we edit the account only if a user was provided
    - Remove 'md-modal' mentions from the stylesheet
    - Back to Meteor 2.9.0
    - pwixRoles global is renamed as Roles
    - Make sure alanning:roles is also available on client side

### 1.1.3

    Release date: 2023- 6-20

    - Remove obsolete deep-equal dependency

### 1.1.2

    Release date: 2023- 6-20

    - Fix global object definition

### 1.1.1

    Release date: 2023- 6-20

    - Fix default configuration

### 1.1.0

    Release date: 2023- 6-20

    - Define Roles.i18n.namespace() which returns the i18n namespace of the package (todo #8)
    - Replace merge and deep-equal dependencies with lodash
    - configure() now acts both as a getter and a setter

### 1.0.1

    Release date: 2023- 6-12

    - Fix Meteor packaging, setting alanning:roles version requirement

### 1.0.0

    Release date: 2023- 6-12

    - Initial release

---
P. Wieser
- Last updated on 2026, May. 2nd
