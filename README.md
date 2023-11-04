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

```
    meteor add pwix:roles
```

### Definition of the roles hierarchy

At initialization time, `pwix:roles` reads already defined roles from the database.

Nonetheless, the hierarchy of roles you plan to use should be provided to the package at configuration time.

```
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
                    children: [

                    ]
                },
                {
                    ...
                }
            ],
            aliases: [                                  one can define aliases, i.e. distinct names which are to be considered as same roles
                [ <name1>, <name2>, ... ],
                [ ... ]
            ]
        }
    });
```

## Package configuration

The package's behavior can be configured through a call to the `Roles.configure()` method, with just a single javascript object argument, which itself should only contains the options you want override.

Known configuration options are:

- `roles`

    Define the known roles.

    Defaults to an empty object.

- `maintainHierarchy`

    Whether the package should update the recorded hierarchy to match the provided one:

    - new roles are added
    - obsolete and unused roles are removed
    - obsolete while still used roles are kept.

    In order to make sure that the application has had a chance to configure the package, this work is done on the server at startup time.

    Defaults to `true`.

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

Please note that `Roles.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `Roles.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## What does it provide ?

### `Roles`

The globally exported object.

### Functions

- `Roles.current()`

    A (client-only) reactive data source which provides the roles of the currently logged-in user as an object:

```
    - id        {String}    the current user identifier
    - all       {Array}     all the roles, either directly or indirectly set
    - direct    {Array}     only the directly attributed top roles in the hierarchy (after having removed indirect ones)
```

- `Roles.directRolesForUser( user )`

    Returns the direct roles of the user (_i.e._ only the first level of the hierarchy) as an array.

    - `user`: a user identifier or a user object

- `Roles.EditPanel.checked( tree )`

    Parms:
    - `tree`: the jQuery object which addresses the tree

    Returns:
    - on client side, the list of checked roles.

    This is a companion function for the `prEditPanel` component, and thus a client-only function.

- `Roles.getUsersInScope( scope )`

    Parms:
    - `scope`: a scope identifier

    Returns:
    - on server side, the array of user identifiers of accounts which have a role in this scope
    - on client side, a `Promise` which resolves to the result array.

- `Roles.ready()`

    A (client-only) reactive data source which becomes `true` when the package is ready to be used (actually when the `alanning:roles` underlying package publication for the current user is ready).

- `Roles.userIsInRoles( user, roles )`

Whether the specified user has at least one the specified roles.

    - `user`: either a user identifier or a user document
    - `roles`: either a single role or an array of roles

Returns `true` if the user has any of the specified roles.

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

These are Meteor methods, i.e. to be `Meteor.call(...)` by the client.

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

A modal dialog which let edit user's roles.

It can be configured by calling `{{> prEdit (args) }}`, where `args` is an object with following keys:

- `id`: optional, the user identifier
- `user`: optional, the user full record
- `roles`: optional, a ReactiveVar which is expected to contain the list of currently attributed roles.

Order of precedence is:
1. id
2. user
3. roles

If `id` is specified, this is enough and the component takes care of read the attributed roles of the identified user.

Else, if `user` is specified, then the component takes care of read the attributed roles of the user.

Else, if `roles` are specified, then they are edited, and updated in this var.

As a side effect, if an information is given about the user (id or user itself), then the mail address is displayed in the dialog title.

Example:

![editing](/maintainer/png/prEdit_512.png)

### Constants

## NPM peer dependencies

Starting with v 1.0.0, and in accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies), we no more hardcode NPM dependencies in the `Npm.depends` clause of the `package.js`. 

Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 1.2.0:

```
    'lodash': '^4.17.0',
    'uuid': '^9.0.0'
```

Each of these dependencies should be installed at application level:
```
    meteor npm install <package> --save
```

## Translations

New and updated translations are willingly accepted, and more than welcome. Just be kind enough to submit a PR on the [Github repository](https://github.com/trychlos/pwix-roles/pulls).

---
P. Wieser
- Last updated on 2023, Oct. 11th
