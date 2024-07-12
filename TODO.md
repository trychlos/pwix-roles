# pwix:roles - TODO

## Summary

1. [Todo](#todo)
2. [Done](#done)

---
## Todo

|   Id | Date       | Description and comment(s) |
| ---: | :---       | :---                       |
|    1 | 2023- 2- 2 | have aliases |
|    3 | 2023- 2- 2 | implement f_CleanupObsoleteRoles at startup |
|    6 | 2023- 2-10 | prEdit: checks **must also** be done server-side |
|   14 |  |  |

---
## Done

|   Id | Date       | Description and comment(s) |
| ---: | :---       | :---                       |
|    2 | 2023- 2- 2 | prEdit: a user should not be able to give roles higher than his own |
|      | 2024- 7- 6 | done for global roles |
|      | 2024- 7- 7 | done for scoped roles |
|    4 | 2023- 2-10 | read existing roles at initialization (before configured) so that we have something |
|      | 2024- 7- 6 | no use case -> cancelled |
|    5 | 2023- 2-10 | should plan enough rewriting to better distinguish between client-only features and server-only ones |
|      |            | as an example, ready and current are rather relevant on the client |
|      | 2023- 6- 6 | done for ready() |
|      |            | though current could be useful on the server in below checks for example |
|      | 2024- 7- 8 | I think this is done (or enough done at least) |
|    7 | 2023- 6- 6 | f_DefineNewRoles() must be tolerant if roles are not configured |
|      | 2024- 7- 8 | I no more understand the above line: how to define a new role if not configured ?? |
|    8 | 2023- 6-12 | Have Roles.i18n.namespace() to let another package add a translation to this one |
|      | 2023- 6-20 | done |
|    9 | 2023- 7- 7 | deeeper tests of listByRole publication when a user manager is available |
|      | 2023- 7- 8 | reactivity is validated with Accord33 users manager |
|   10 | 2023-12- 3 | prEdit doesn't manage several hierarchies |
|      | 2024- 7- 6 | yes, it does (though I don't really understand the use case as APP_ADMIN should be nonetheless allowed to all actions) -> fixed |
|   11 | 2023-12- 3 | prView/prEdit should display the 'scoped' attribute |
|      | 2024- 7- 7 | done for prEdit |
|      | 2024- 7-10 | done for prView |
|   12 | 2024- 7- 6 | en_US and fr_FR should be renamed to more generalized en and fr |
|      | 2024- 7- 8 | done |
|   13 | 2024- 7-10 | have a message saying there is no scoped role |
|      | 2024- 7-10 | done |

---
P. Wieser
- Last updated on 2024, Jul. 12th
