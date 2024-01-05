# CareManager Service

## Useful Links

- [CareManager Runbook](https://github.com/*company-data-covered*/services/blob/trunk/docs/runbook/caremanager-service.md)

## Dev Setup

**Note**: this guide assumes you are running the service on a MacOS system.

1. Set the following variables in your `.env.development.local` file (mostly required for test commands):

   ```sh
   # CareManager will use this URL to connect to the DB, it has all connection information in it
   DATABASE_URL=postgres://postgres:postgres@localhost:5433/caremanager?sslmode=disable
   # The dev Postgres instance is configured to listen for connection in the host on port 5433
   DB_POSTGRESQL_PORT=5433
   ```

1. Run the `ensure-dev-db-caremanager` command from the Makefile. This command will create a database named `caremanager` in the Postgres instance and migrate it to its latest state.

   ```sh
   make ensure-dev-db-caremanager
   ```

1. Run the services caremanager depends on:

   - Station ([instructions](https://github.com/*company-data-covered*/station/blob/trunk/README.md))
   - Audit service ([instructions](https://github.com/*company-data-covered*/services/blob/trunk/go/cmd/audit-service/README.md))
   - Logistics service ([instructions](https://github.com/*company-data-covered*/services/blob/trunk/go/cmd/logistics-service/README.md))

1. Run the service to check if it can connect to the DB:

   ```sh
   ./scripts/caremanager/run-caremanager-service-dev.sh
   ```

## Authorization

To run the service with real authorization, set `AUTHORIZATION_DISABLED` to `false` and be sure to have the `CAREMANAGER_SERVICE_AUTH0_AUDIENCE` and `CAREMANAGER_SERVICE_AUTH0_ISSUER_URL` env vars set in your `.env.development.local` file.

_TODO (AC-1184): Get CareManager auth-related env vars into the .env file by default._

## Migrations

### Running Migrations

To update your database to the latest available migration run:

```sh
make db-migrate-caremanager
```

### Creating Migrations

To create a new migration run:

```sh
name=<name_of_your_migration> make db-create-migration-caremanager
```

Example:

```sh
name=create_patients_table make db-create-migration-caremanager
```

**Note**: after creating a migration be sure to sync the DB dump and run the SQL files formatter:

```sh
make dump-db-schema-caremanager
make format-sql
```

### Writing Queries

Queries for CareManager are located in `sql/caremanager/queries`. In this directory, there are files with the `_query` suffix and `.sql` extension, organized based on the entity they will be operating. These files will contain queries annotated using `sqlc` syntax. For more information on how to annotate queries, check [sqlc documentation](https://docs.sqlc.dev/en/latest/index.html).

**Note 1**: `sqlc` code generation will be run automatically for you when issuing the `run-go-caremanager-service` command. There is also a way of invoking the code generation manually using `make gen-sql`

**Note 2**: after creating or modifying a query file be sure to run the SQL files formatter:

```sh
make format-sql
```

## Testing

### Running the Test Suite

There are two main categories for tests related to CareManager (and other services of the `services` monorepo). These two categories are database and non-database tests. As the naming implies, the difference is the fact that some tests need to connect to the database while others don't.

Tests that connect to the database can be identified by looking at the top of the test file and looking for the `//go:build db_test` directive.

**Note:** if you are creating a new test file that will connect to the database, add that directive at the start of the file. Similarly, if you are introducing a database test into a file that doesn't have that directive, create a new test file with the `_db_test.go` suffix instead.

To run database tests use:

```sh
make test-db-go-caremanager-service
```

To run non-database tests use:

```sh
make test-go-caremanager-service
```

## PRs

Please review general PR guidelines outlined [here](../../../docs/code/developer.md).

### PR Titles

The correct title style for CareManager-related PRs is `[AC-XXXX] CareManager: <brief PR description>` in accordance to _company-data-covered_'s PR guidelines (linked in the section above).

## Deployment

For deployment instructions, refer to _company-data-covered_'s common documentation for deploying Aptible apps [here](https://*company-data-covered*.atlassian.net/wiki/spaces/EC/pages/89194584/Deploying+A+Service+To+Aptible+Via+Github+Actions).

### Changelogs

Each CareManager production release should have a changelog. To obtain a changelog delta for CareManager between two Git SHAs use:

```sh
git log <currrently deployed SHA in Aptible>...<commit to be deployed to Aptible e.g. trunk> --oneline \
    go/cmd/caremanager-service/ \
    sql/caremanager/ \
    proto/caremanager/ \
    go/pkg/audit \
    go/pkg/auth \
    go/pkg/basedb \
    go/pkg/baselogger \
    go/pkg/baseserv \
    go/pkg/buildinfo \
    go/pkg/cors \
    go/pkg/grpcgateway \
    go/pkg/monitoring \
    go/pkg/sqltypes \
    go/pkg/station \
    proto/audit \
    proto/caremanager \
    proto/market \
    proto/user
```

This command aims to check the directories of code relevant to CareManager, and should be properly updated when adding (or removing) dependencies to CareManager.

Note: to get the currently deployed SHA in Aptible run `aptible config --app caremanager-service-<env>` and check the value of `APTIBLE_DOCKER_IMAGE`. This values is also available in Aptible's Dashboard.
