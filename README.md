# pwix:roles - README

## What is it ?

A Meteor package which encapsulates and extends `alanning:roles`.

## Why ?

`alanning:roles` is a very good package. I like it!

I particularly like its way of defining roles, both as atomic capabilities and as conceptual user roles. This let the developer build a full hierarchy of roles/permissions/capabilities, whatever be the word you prefer...

Its concept of scope is not the least of this package.

While `alanning:roles` provides primitives to execute CRUD operations on the roles, `pwix:roles` rather tries to manage the role's hierarchy itself. As such, the package adds:

- the primitives to manage of directly attributed roles vs. inherited ones,
- aliases (todo #1)
- a way of detected obsolete roles and to automatically cleanup them (a bit useful during development cycles)
- some standard dialogs for viewing and editing roles.

## Usage

### Installation

This Meteor package is installable with the usual command:

```sh
    meteor add pwix:roles
    meteor npm install lodash uuid --save
```

### Definition of the roles hierarchy

`pwix:roles` expects that the hierarchy of roles the application plan to use be provided to the package at configuration time, as a `roles.hierarchy` array fo objects with followoing keys:

- `name`: the mandatory name of the role
- `children`: the child roles as same objects (a recursive definition), defaulting to none
- `scoped`: whether the role is scoped, defaulting to `false`. When a role is scoped, all its children are scoped too.

```js
    import { Roles } from 'meteor/pwix:roles';

    Roles.configure({
        roles: {                                        topmost key of the hierarchy object
            hierarchy: [                                description of the hierarchy as an array of role objects
                {
                    name: <name1>,                      a role object must have a name which uniquely identifies the role
                    children: [                         a role object may have zero to many children, each of them being itself a role object
                        {
                            name: <name2>,
                            children: [                 there is no limit to the count of recursivity levels of the children
                                {
                                    ...
                                }
                            ]
                        }

                    ]
                },
                {
                    name: <name>,
                    scoped: true,                       if a role is scoped, then all its children are scoped too
                    children: [

                    ]
                },
                {
                    ...
                }
            ],
            aliases: [                                  one can define aliases, i.e. distinct names which are to be considered as same roles (todo #1)
                [ <name1>, <name2>, ... ],
                [ ... ]
            ]
        }
    });
```

### Scoped vs. non-scoped roles

As soon as an application needs roles, it needs an application administrator. So, as far as Roles is concerned, there is always at least one non-scoped role.

An application may too want manage scoped roles, whatever be - from Roles point of view - the exact scope semantic.

Roles considers that scopes are dynamic, .e. they are not, and they cannot, be all known in advance. The best that Roles can do is to know scopes for which at least one role has been assigned. Whether a label or any other property is attached to scopes is not of direct Roles ressort, though we provide indirections to be able to provide such properties.

## Package configuration

The package's behavior can be configured through a call to the `Roles.configure()` method, with just a single javascript object argument, which itself should only contains the options you want override.

Known configuration options are:

- `allowFn`

    An async function which will be called with an action string identifier, and must return whether the current user is allowed to do the specified action.

    If the function is not provided, then the default is to allow all actions (not very desirable nor secure, in fact, but compatible with the previous versions).

    **So, the application should take care of protecting the roles by providing here a suitable function.**

    `allowFn` prototype is: `async allowFn( action<String> [, user<String|Object> ][, ...<Any> ] ): Boolean`

    If the user is not provided, the `allowFn` function is expected to default to the currently logged-in user.

    At the moment, the asked permissions are:

    - `pwix.roles.fn.getRolesForUser`
    - `pwix.roles.fn.getUsersInScope`
    - `pwix.roles.fn.removeAssignedRolesFromUser`
    - `pwix.roles.fn.removeUserAssignmentsFromRoles`
    - `pwix.roles.fn.setScopedAssignments`
    - `pwix.roles.fn.setUserRoles`
    - `pwix.roles.fn.usedScopes`
    - `pwix.roles.method.addUsersToRoles`
    - `pwix.roles.method.countUsersInRoles`
    - `pwix.roles.method.createRole`
    - `pwix.roles.pub.user_assignments`
    - `pwix.roles.pub.used_scopes`
    - `pwix.roles.pub.count_by_roles`

- `assignmentsCollection`

    The name of the collection where roles assigned to a user are kept.

    Defaults to `role-assignment`.

- `maintainHierarchy`

    Whether the package should update the recorded hierarchy to match the provided one:

    - new roles are added
    - obsolete and unused roles are removed
    - obsolete while still used roles are kept.

    In order to make sure that the application has had a chance to configure the package, this work is done on the server at startup time.

    Defaults to `true`.

- `roles`

    Define the known roles.

    Defaults to an empty object.

- `scopeLabelFn`

    An async function which will be called with a scope identifier argument, and is expected to return the label attached to the scope.

    This function defaults to null. When null, or if the function returns null, the package will just use the scope identifier as the label.

- `scopesFn`

    An async function which will be called without argument, and is expected to return the list of managed scopes as an array of:

    - ids as string
    - or { _id: <id>, label: <label> } objects.

    This function defaults to null. When null, the package will try to take known scopes from used scopes.

- `scopesCollection`

    The name of the collection used by the `scopesPub` publication, defaulting to `pwix_roles_used_scopes`.

- `scopesPub`

    The name of a publication which is expected to publish the list of managed scopes as an array of:

    - ids as string
    - or { _id: <id>, label: <label> } objects

    in a collection of the same name.

    This name defaults to `pwix.Roles.p.usedScopes`. In that case, the package will try to take known scopes from used scopes.

- `verbosity`

    Define the expected verbosity level.

    The accepted value can be:

    - `Roles.C.Verbose.NONE`

        Do not display any trace log to the console

    or any or-ed combination of following:

    - `Roles.C.Verbose.CONFIGURE`

        Trace `Roles.configure()` calls and their result

    - `Roles.C.Verbose.CURRENT`

        Emit a trace on `Roles.current()` changes

    - `Roles.C.Verbose.MAINTAIN`

        Trace (on the server) the operations done while maintaining the roles hierarchy at startup time.

    - `Roles.C.Verbose.READY`

        Emit a trace on `Roles.ready()` changes

    - `Roles.C.Verbose.STARTUP`

        Emit a trace at startup time

    - `Roles.C.Verbose.VIEWADD`

        Emit a trace on `Roles.viewAdd()` invocations

    - `Roles.C.Verbose.FUNCTIONS`

        Trace all functions calls.

    Define the expected verbosity level.

- `withAccountsUIDropdownItem`

    Whether to install a (localized) 'My roles' menu item in the AccountsUI dropdown menu when the user is logged in, defaulting to `true`.

    This requires that the `pwix:accounts-ui` package be used by the application, which is not required by this package.

    New in v1.9.

Please note that `Roles.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `Roles.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## What does it provide ?

### `Roles`

The globally exported object.

### Client-side only functions

#### `Roles.current()`

A reactive data source which provides the assigned roles of the currently logged-in user as an object:

```js
    {
        userId:             <String>    the current user identifier
        global: {                       describes the global roles of the user
            all:            <Array>     the array of directly assigned roles
            direct:         <Array>     the array of all roles of the user, whether they have been directly assigned, or inherited from the roles hierarchy
        }
        scoped: {                       a per-scope object where each key is a scope, and the value is an object with following keys:
            <scope_identifier>: {
                all:        <Array>     the array directly assigned roles
                direct:     <Array>     the array of all roles of the user, whether they have been directly assigned, or inherited from the roles hierarchy
            }
        }
```

NB 1: this object gathers assigned roles, and that they are not filtered through the current configured hierarchy. It may so happen that some assigned roles can be not (no more) defined in a new hierarchy. This is the task of the configured `maintainHierarchy` indicator to make sure that there is no difference between assigned roles and defined ones.

NB 2: the description of the `current()` object is changed in v1.5 to better host global and scopes roles.

#### `Roles.ready()`

A reactive data source which becomes `true` when the package is ready to be used (actually when the `alanning:roles` underlying package publication for the current user is ready).

Note that the readyness of the package doesn't depend of its configuration.

### Common functions

#### `async Roles.addUsersToRoles( users, roles, options )`

An async function which directly calls the underlying `alanning:roles/addUsersToRolesAsync()` function, just making sure it is called on the server.

The function is subject to `pwix.roles.fn.addUsersToRoles` permission.

Returns nothing.

#### `Roles.compareLevels( userA<Object|String>, userB<Object|String> )`

Compare the roles assigned to the two specified users, and provide a pseudo classement based of the level of their highest role.

Returns:

- `-1` if highest role of user A is lower than highest role of user B
- `0` if highest role of user A has same level than highest role of user B
- `+1` if highest role of user A is higher than highest role of user B

Rationale: this let compare the capabilities of two accounts. A typical use case is to allow an account to edit other accounts, but only with lower role levels, and for example, prevent him to editing the application administration account.

#### `Roles.configure( o<Object> )`

See [above](#package-configuration).

A reactive data source.

#### `Roles.flat()`

Returns the configured roles hierarchy flattened as a hash of objects `name` -> `{ name, children, scoped }`

#### `async Roles.getUserRoles( target<Object|String>, requester<Object|String> )`

An async function which returns the roles of the `target` user.

The `requester` argument is ignored on client-side, as we use the currently connected user. On server-side, the argument is mandatory.

The function is subject to `pwix.roles.fn.getUserRoles` permission, which always resolves to `true` when requester is the target.

Returns roles as the usual `{ userId, global, scoped }` object.

#### `async Roles.hasScopedRole( target<Object|String>, scope<String>, requester<Object|String> )`

An async function which returns `true` if the user has any role in the given scope.

The `requester` argument is ignored on client-side, as we use the currently connected user. On server-side, the argument is mandatory.

The function is subject to `pwix.roles.fn.hasScopedRole` permission, which always resolves to `true` when requester is the target.

#### `Roles.highestLevel( roles<Array> )`

Compute the highest level among the provided list of roles, returning the level number, '0' being the root of the role hierarchy.

NB 1: the lower this level, the higher the role is in the hierarchy.

NB 2: as a consequence, returns a very high level if the roles are empty (no role implies very low level in the hierarchy).

#### `Roles.isRoleScoped( role<String> )`

Returns `true` if the role is defined as scoped.

#### `async Roles.removeAssignedRolesFromUser( target<Object|String>, requester<Object|String> )`

Remove the assigned roles when an account is deleted.

The `requester` argument is ignored on client-side, as we use the currently connected user. On server-side, the argument is mandatory.

The function is subject to `pwix.roles.fn.removeAssignedRolesFromUser` permission, which always resolves to `false` when requester is the target.

Returns `true` if the function was successful.

#### `Roles.scopedRoles()`

Returns an array of defined scoped roles. Children are not included as scoped per definition.

#### `async Roles.setUserRoles( target<Object|String>, roles<Object>, requester<Object|String> )`

Assign the specified roles to the targeted user.

The `requester` argument is ignored on client-side, as we use the currently connected user. On server-side, the argument is mandatory.

The `roles` must be specified as an object `{ global: { direct[] }, scoped: { <scope>: { direct: [] }}}`

The function is subject to `pwix.roles.fn.setUserRoles` permission, which always resolves to `false` when requester is the target.

Returns `true` if the function was successful.

#### `Roles.suggestedPermissions()`

Returns an object suitable to be provided to `Roles.allowFn()` permissions manager.

#### `Roles.userIsInRoles( user, roles [, opts ])`

An async function which says if the specified user has at least one the specified roles.

- `user`: either a user identifier or a user document
- `roles`: either a single role or an array of roles

Returns `true` if the user has any of the specified roles.

#### `Roles.usedScopes()`

An async function which says if the specified user has at least one the specified roles.

- `user`: either a user identifier or a user document
- `roles`: either a single role or an array of roles

Returns `true` if the user has any of the specified roles.

#### `Roles.viewAdd( o )`

Add an additional tab to the `prView` dialog.

The to-be added tab is described by the provided object which must exhibit following keys:

- `tabLabel`: a function which will be called with a `tabItem` argument, and must return the tab label as a string

- `paneContent`: a function which will be called with a `tabItem` argument, and must return a Promise which must eventually resolves to the HTML pane content.

### Blaze components

#### `prView`

A modal dialog which shows the roles of the user distinguishing directly attributed from inherited ones.

It can be configured by calling `{{> prView (args) }}`, where `args` is an object with following keys:

- `title`: an optional ReactiveVar which contains the modal title, defaulting to (localized) 'My roles'.

The main tab, showing to the user only his own roles:

![main tab](/maintainer/png/prView_main_512.png)

An example of a tab added via `Roles.viewAdd()`:

![added tab](/maintainer/png/prView_add_512.png)

#### `prEdit`

Display the `prEditPanel` inside of a modal dialog.

As a side effect, if an information is given about the user (id or user itself), then the mail address is displayed in the dialog title.

Example:

![editing](/maintainer/png/prEdit_512.png)

#### `prEditPanel`

A panel which can be embdded into your application and let edit user's roles.

It can be configured by calling `{{> prEditPanel (args) }}`, where `args` is an object with following keys:

- `user`: optional, the user identifier or the user full document record

If the user is not specified or not identified, then the edition begins with an empty set of roles.

The caller can get the result back in two ways:

- either by listening at the `pr-change` event:

    This event is triggered on the tree:
    
    - once after the initial population of the tree

    - then each time the user changes the selection by cyhecking/uncheckibng the checkboxes.

Starting with v1.5, the application can also use:

- the `pr-global-state` event, triggered with a data `{ global: direct<Array> }` which only contains directly attributed global roles

- the `pr-scoped-state` event, triggered with a data `{ scoped: { <scope>: { direct<Array> }}}` which only contains directly attributed scoped roles for each scope

- the `Roles.EditPanel.global()` function which returns the array of directly attributed global roles

- the `Roles.EditPanel.scoped()` function which returns the array of directly attributed scoped roles for each scope.

Please note that either through the event or through the function, scoped roles are aonly returned when they are valid, i.e. with a not empty scope and at least one role.

- the `Roles.EditPanel.roles()` function returns both global and scoped roles as an object:

```js
    - <scope>     {Object}
        - direct    {Array}     an array of directly (not inherited) assigned scoped roles
    - global    {Object}
        - direct    {Array}     an array of directly (not inherited) assigned scoped roles
```


As a companion function for the `prEditPanel` component, this is a client-only function.

Note: without explicitely requiring it, `pwix:roles` is able to take advantage of `pwix:forms` to display a status indicator on the scoped pane. This let the user have a visual indication of whether the current scope/roles group will be saved or not.

## NPM peer dependencies

Starting with v 1.0.0, and in accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#peer-npm-dependencies), we no more hardcode NPM dependencies in the `Npm.depends` clause of the `package.js`.

Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 1.10.0:

```js
    '@tacman1123/jstree-esm': '^4.0.0',
    'lodash': '^4.17.0',
    'uuid': '^9.0.0 || ^10.0.0 || ^11.0.0'
```

Each of these dependencies should be installed at application level:

```js
    meteor npm install <package> --save
```

## Translations

New and updated translations are willingly accepted, and more than welcome. Just be kind enough to submit a PR on the [Github repository](https://github.com/trychlos/pwix-roles/pulls).

---
P. Wieser
- Last updated on 2026, May. 2nd
