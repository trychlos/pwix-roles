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

```sh
    meteor add pwix:roles
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

As soon as an application needs roles, it needs an application administrator. So, as far as Roles is concerned, there is always at least one non-scoped roles.

An application may too want manage scoped roles, whatever be - from Roles point of view - the exact scope semantic.

Roles considers that scopes are dynamic, and cannot be all known. At any moment, it is so only possible to attribute to a user a scoped role for an existing scope.

From scope point of view, several strategies are possible:

- in an accounts manager, we can attribute to every user scoped roles to existing scopes (as soon, at least, as we are able to have a list of these scopes)

- at the scope domain level, we can managed users permissions by attributing them scoped roles.

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
    - `pwix.roles.fn.setUserRoles`
    - `pwix.roles.fn.usedScopes`
    - `pwix.roles.method.addUsersToRoles`
    - `pwix.roles.method.countUsersInRoles`
    - `pwix.roles.method.createRole`
    - `pwix.roles.pub.user_assignments`
    - `pwix.roles.pub.used_scopes`
    - `pwix.roles.pub.count_by_roles`

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

- `scopesPub`

    The name of a publication which is expected to publish the list of managed scopes as an array of:

    - ids as string
    - or { _id: <id>, label: <label> } objects

    in a collection of the same name.

    This name defaults to null. When null, the package will try to take known scopes from used scopes.

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

Please note that `Roles.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `Roles.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## What does it provide ?

### `Roles`

The globally exported object.

### Functions

- `Roles.addUsersToRoles( users, roles, options )`

    An async function which directly calls the underlying `alanning:roles/addUsersToRolesAsync()` function, just making sure it is called on the server.

    Returns nothing.

    Available both on client and server.

- `Roles.compareLevels( userA<Object|String>, userB<Object|String> )`

    Compare the roles assigned to the two specified users, and provide a pseudo classement based of the level of their highest role.

    Returns:

    - `-1` if highest role of user A is lower than highest role of user B
    - `0` if highest role of user A has same level than highest role of user B
    - `+1` if highest role of user A is higher than highest role of user B

    Rationale: this let compare the capabilities of two accounts. A typical use case is to allow an account to edit other accounts, but only with lower role levels, and for example, prevent him to editing the application administration account.

- `Roles.configure( o<Object> )`

    See [above](#package-configuration).

    A reactive data source.

    Available both on client and server.

- `Roles.current()`

    A reactive data source which provides the assigned roles of the currently logged-in user as an object:

```js
    - userId    {String}    the current user identifier
    - scoped    {Object}    a per-scope object where each key is a scope, and the value is an object with following keys:
        - direct    {Array}     an array of directly (not inherited) assigned scoped roles
        - all       {Array}     an array of all allowed scoepd roles (i.e. directly assigned+inherited)
    - global    {Object}
        - direct    {Array}     an array of directly (not inherited) assigned scoped roles
        - all       {Array}     an array of all allowed scoepd roles (i.e. directly assigned+inherited)
```

    Note that this object gathers assigned roles, and that they are not filtered through the configured hierarchy. It may so happen that some assigned roles can be not defined in a new hierarchy. This is the task of the configured `maintainHierarchy` indicator to make sure that there is no difference between assigned roles and defined ones.

    Available on client only.

    Note that the description of the `current()` object is changed in v 1.5.0 to better host global and scopes roles.

- `Roles.suggestedPermissions()`

    Returns an object suitable to be provided to `Roles.allowFn()` permissions manager.

    These are NOT default as the internal permissions manager doesn't care of these, and actually defaults to `true`.

- `Roles.directRolesForUser( user )`

    An async function which returns the direct roles of the user (_i.e._ only the first level of the hierarchy) as an array.

    - `user`: a user identifier or a user object

    Available both on client and server.

- `Roles.flat()`

    Returns the configured roles hierarchy as a flat object `name` -> `{ name, children, scoped }`.

    Available both on client and server.

- `Roles.getRolesForUser( user, options )`

    An async function which returns the list of roles directly attributed (_i.e._ ignoring the inherited roles) to the user as an array of documents:
    - `_id`: the role identifier (its name)
    - `_scope`: the relevant scope (only if `anyScope` option is `true`).

    Parms:
    - `user`: a user document or a user identifier
    - `options`: an options object with following keys:

        - `scope`: the desired scope
        - `onlyScoped`: if set to `true`, only returns the roles in the given `scope`

    To get just global (non-scoped) roles, set `onlyScoped` to `true` and leave the `scope` option undefined.

    To get just scoped roles roles, set `onlyScoped` to `true` and a `scope`.

    If `onlyScoped` is falsy, all roles will be returned.

    Available both on client and server.

- `Roles.getUsersInScope( scope )`

    An async function which returns the array of user identifiers of accounts which have a role in this scope, maybe empty.

    Available both on client and server.

- `Roles.isRoleScoped( role )`

    Whether the specified role is defined as scoped.

    Available both on client and server.

- `Roles.ready()`

    A reactive data source which becomes `true` when the package is ready to be used (actually when the `alanning:roles` underlying package publication for the current user is ready).

    Note that the package considers itself as ready even if it has not yet been configured.

    Available on client only.

- `Roles.removeAssignedRolesFromUser( user )`

    An async function which removes all currently defined roles for this user.

    Returns `true` if all roles have been successfully deleted for this user.

    The application should take care of **not** remove all roles for the currently logged-in user. This is not checked by the package.

    Available both on client and server.

- `Roles.removeUserAssignmentsFromRoles( roles, opts )`

    An async function which removes all currently defined assignements for the specified role(s).

    Returns an array with a result per role.

    The application should take care of **not** remove all roles for the currently logged-in user. This is not checked by the package.

    Available both on client and server.

- `Roles.setUserRoles( user, roles )`

    An async function which replaces all currently defined roles for the specified user.

    `user` may be a user identifier or a user document

    `roles` is an object { global: { direct: [], scoped: { <scope>: { direct: [] }}}}

    The application should take care of **not** remove all roles for the currently logged-in user. This is not checked by the package.

    Available both on client and server.

- `Roles.suggestedPermissions()`

    Returns an object with `allowFn` function for the package asked permissions. This object is suitable to feed the `pwix:permissions` manager, and can be overriden by the application.

    Available both on client and server.

- `Roles.usedScopes()`

    An async function which returns an array of used scopes. This array will most probably at least include the 'null' scope.

    Available both on client and server.

- `Roles.userIsInRoles( user, roles [, opts ])`

    An async function which says if the specified user has at least one the specified roles.

    - `user`: either a user identifier or a user document
    - `roles`: either a single role or an array of roles

    Returns `true` if the user has any of the specified roles.

    Available both on client and server.

- `Roles.viewAdd( o )`

    Add an additional tab to the `prView` dialog.

    The to-be added tab is described by the provided object which must exhibit following keys:

    - `tabLabel`: a function which will be called with a `tabItem` argument, and must return the tab label as a string

    - `paneContent`: a function which will be called with a `tabItem` argument, and must return a Promise which must eventually resolves to the HTML pane content.

- `Roles.i18n.namespace()`

    Returns the i18n namespace of the package.

Note from `alanning:roles` documentation:

    Roles functions which modify the database should not be called directly, but inside the Meteor methods.

### Methods

These are Meteor Mongo methods, i.e. to be `Meteor.callAsync(...)` by the client.

- `Roles.addUsersToRoles( users, roles, options )`

    Add roles to existing roles for each user.

    - `users`: a user identifier, or a user object, or an array of user identifiers or user objects

    - `roles`: a role name or an array of role names

    - `options`: an optional object with following keys:

        - `scope`: name of the scope, or null for the global role

        - `ifExists`: if true, do not throw an exception if the role does not exist

    This method directy calls `alanning:roles.addUsersToRoles()` function. It is just clearer that this is a server code.

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

Starting with v 1.5.0, the application can also use:

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

Dependencies as of v 1.6.0:

```
    'lodash': '^4.17.0',
    'uuid': '^9.0.0 || ^10.0.0'
```

Each of these dependencies should be installed at application level:
```
    meteor npm install <package> --save
```

## Translations

New and updated translations are willingly accepted, and more than welcome. Just be kind enough to submit a PR on the [Github repository](https://github.com/trychlos/pwix-roles/pulls).

---
P. Wieser
- Last updated on 2024, Oct. 4th
