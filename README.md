# pwix:roles - README

## What is it ?

A Meteor package which encapsulates `alanning:roles`.

## Why ?

alanning:roles is a very good package. I like it!

I particularly like its way of defining roles, both as atomic capabilities and as conceptual user roles. This let the developer build a full hierarchy of roles/permissions/capabilities, whatever be the word you prefer...

Its concept of scope is not the least of this package.

But I missed some things that I have added here:
- a reactive data source for the roles of the currently logged-in user,
- the concept of directly attributed roles vs. inherited ones,
- aliases (todo #1)
- a way of detected obsolete roles and to automatically cleanup them (a bit useful during development cycles)
- some standard dialogs for viewing and editing roles.

## Usage

### Installation

```
    meteor add pwix:roles
```

### Configure

At initialization time, `pwix:roles` reads already defined roles from the database.

Nonetheless, the hierarchy of roles you plan to use should be provided to the package at configuration time.

```
    import { pwiRoles } from 'meteor/pwix:roles';

    pwiRoles.configure({
        roles: {
            hierarchy: [
                {
                    name: <role_name>,
                    children: [
                        {
                            name: <role_name>,
                            children: [
                                ... and so on
                            ]
                        }
                    ]
                }
            ],
            aliases: [
                ... see that later
            ]
        }
    });
```

## What does it provide ?

### An exported object

`pwiRoles`

The `pwix:roles` package exports a single `pwiRoles` object which holds all necessary data and functions.

### Constants

#### Verbosity of the package

### Blaze components

#### prView

#### prEdit

## Configuration

The package MUST be configured before Meteor.startup(), so at the top of the application code.
At least a hierarchy of the expected roles must be provided.
The configuration must be done in identical terms **both** in client and in server sides.

### Roles configuration

Roles have to be declared as an object with a top single key 'roles'
```
    {
        roles: {                                        mandatory topmost key of the configuration object
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
    }
```

### Methods

`pwiRoles.current()`

A reactive data source which returns on the client the roles of the currently logged-in user as an object:
```
- id        {String}    the current user identifier
- all       {Array}     all the roles, either directly or indirectly set
- direct    {Array}     only the directly attributed top roles in the hierarchy (after havng removed indirect ones)
```

## NPM peer dependencies

In accordance with advices from [the Meteor Guide](https://guide.meteor.com/writing-atmosphere-packages.html#npm-dependencies), we do not hardcode NPM dependencies in `package.js`. Instead we check npm versions of installed packages at runtime, on server startup, in development environment.

Dependencies as of v 1.1.0:
```
    '@popperjs/core': '^2.11.6',
    bootstrap: '^5.2.1',
    jstree: '^3.3.12',
    uuid: '^9.0.0'
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
