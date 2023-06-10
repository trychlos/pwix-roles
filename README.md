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
    import { pwixRoles } from 'meteor/pwix:roles';

    pwixRoles.configure({
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

The package's behavior can be configured through a call to the `pwixRoles.configure()` method, with just a single javascript object argument, which itself should only contains the options you want override.

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

    - `PR_VERBOSE_NONE`

        Do not display any trace log to the console
    
    or any or-ed combination of following:

    - `PR_VERBOSE_CONFIGURE`

        Trace `pwixRoles.configure()` calls and their result

    - `PR_VERBOSE_CURRENT`

        Emit a trace on `pwixRoles.current()` changes

    - `PR_VERBOSE_MAINTAIN`

        Trace (on the server) the operations done while maintaining the roles hierarchy at startup time.

    - `PR_VERBOSE_READY`

        Emit a trace on `pwixRoles.ready()` changes

    - `PR_VERBOSE_STARTUP`

        Emit a trace at startup time

    - `PR_VERBOSE_VIEWADD`

        Emit a trace on `pwixRoles.viewAdd()` invocations

Please note that `pwixRoles.configure()` method should be called in the same terms both in client and server sides.

Remind too that Meteor packages are instanciated at application level. They are so only configurable once, or, in other words, only one instance has to be or can be configured. Addtionnal calls to `pwixRoles.configure()` will just override the previous one. You have been warned: **only the application should configure a package**.

## What does it provide ?

### `pwixRoles`

The globally exported object.

### Methods

- `pwixRoles.current()`

A client-only reactive data source which provides the roles of the currently logged-in user as an object:

```
    - id        {String}    the current user identifier
    - all       {Array}     all the roles, either directly or indirectly set
    - direct    {Array}     only the directly attributed top roles in the hierarchy (after having removed indirect ones)
```

- `pwixRoles.ready()`

A client-only reactive data source which becomes `true` when the package is ready to be used (actually when the `alanning:roles` underlying package publication for the current user is ready).

### Blaze components

#### prView

#### prEdit

### Constants

## NPM peer dependencies

Starting with v 1.0.0, and in accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies), we no more hardcode NPM dependencies in the `Npm.depends` clause of the `package.js`. 

Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 1.0.0:

```
    'deep-equal': '^2.2.0',
    'merge': '^2.1.1',
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
- Last updated on 2023, Feb. 2nd
