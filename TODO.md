# pwix:roles - TODO

## Summary

1. [Todo](#todo)
2. [Done](#done)

---
## Todo

|   Id | Date       | Description and comment(s) |
| ---: | :---       | :---                       |
|    1 | 2023- 2- 2 | have aliases |
|    2 | 2023- 2- 2 | prEdit: a user should not be able to give roles higher than his own |
|    3 | 2023- 2- 2 | implement f_CleanupObsoleteRoles at startup |
|    4 | 2023- 2-10 | read existing roles at initialization (before configured) so that we have something |
|    5 | 2023- 2-10 | should plan enough rewriting to better distinguish between client-only features and server-only ones |
|      |            | as an example, ready and current are rather relevant on the client |
|      | 2023- 6- 6 | done for ready() |
|      |            | though current could be useful on the server in below checks for example |
|    6 | 2023- 2-10 | prEdit: checks **must also** be done server-side |
|    7 | 2023- 6- 6 | f_DefineNewRoles() must be tolerant if roles are not configured |
|   10 |  |  |

---
## Done

|   Id | Date       | Description and comment(s) |
| ---: | :---       | :---                       |
|    8 | 2023- 6-12 | Have pwixRoles.i18n.namespace() to let another package add a translation to this one |
|      | 2023- 6-20 | done |
|    9 | 2023- 7- 7 | deeeper tests of listByRole publication when a user manager is available |
|      | 2023- 7- 8 | reactivity is validated with Accord33 users manager |

---
P. Wieser
- Last updated on 2023, June 20th
