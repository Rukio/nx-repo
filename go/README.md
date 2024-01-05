# Go

## Directories

- [`cmd`](cmd/)
  - Top level binaries
- [`pkg`](pkg/)
  - Shared functionality and libraries, used by various commands
  - _DO NOT_ name packages with generic names like `base`, `common`, `util`. Use targeted functionality names.
    - https://dave.cheney.net/2019/01/08/avoid-package-names-like-base-util-or-common

## Basic guides to Go

- Top level Go documentation - https://go.dev/doc/
- Effective Go - https://go.dev/doc/effective_go
  - Quick overview of important patterns of writing Go
- Package design
  - https://dave.cheney.net/2019/01/08/avoid-package-names-like-base-util-or-common

### Database transactions

For executing transactional queries, use [`DBTX.BeginFunc` method](https://pkg.go.dev/github.com/jackc/pgx/v4#Conn.BeginFunc).

## Tests

### Table driven tests

Write table driven tests, as it reduces boilerplate:

- Ref: https://dave.cheney.net/2019/05/07/prefer-table-driven-tests

### Benchmark tests

Write benchmarks for things that may be slow or need high performance. Database queries are good examples.

- Ref: https://dave.cheney.net/2013/06/30/how-to-write-benchmarks-in-go
