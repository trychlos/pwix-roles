# pwix:roles - README

## What is it ?

A Meteor package which encapsulates alanning:roles

## Usage

## What does it provide ?

### An exported object

        The 'pwix:roles' package:
            - exports a single 'pwiRoles' object which holds necessary data and functions
            - installs some Meteor methods
            - provides components to be included in an user interface
                > prRolesEdit edit the roles attributed to a user

    Configuration.
        The package MUST be configured before Meteor.startup(), so at the top of the application code.
        At least a hierarchy of the expected roles must be provided.
        The configuration must be done in identical terms both in client and in server.

    Roles configuration

    Roles have to be declared as an object with a top single key 'roles'

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
