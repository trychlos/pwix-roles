# pwix:roles

## ChangeLog

### 1.3.0-rc

    Release date: 

    - Define getUsersInScope() function, callable from both client and server side
    - prView: let the caller provide its own data context
    - Exposes prEditPanel to be able to update the roles from inside an application view (thus bumping candidate version number)
    - Define the pr-change event on permissions edition
    - Define Roles.flat() new function
    - Define Roles.removeAllRolesFromUser() new function
    - Define Roles.addUsersToRoles() new function
    - Define Roles.getRolesForUser() new function
    - Fix the the prView selector in the stylesheet
    - Roles.current() now tracks the role whatever be the scope
    - Let a role be used several times inside of the roles hierarchy
    - Define new Role.isRoleScoped() function

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
- Last updated on 2023, Oct. 11th
