# SQL

All SQL schemas and queries should be in this directory.

Single subdirectory for each database, like `logistics`.

`sqlc` is the main tool used for all queries.

- Ref: https://docs.sqlc.dev/en/stable/

Migrations use [`goose`](https://github.com/pressly/goose).

## Resources

- Indexing - https://use-the-index-luke.com/
- Postgres at Scale - https://medium.com/paypal-tech/postgresql-at-scale-database-schema-changes-without-downtime-20d3749ed680
- safe-pg-migrations Rails gem - https://github.com/doctolib/safe-pg-migrations
- PostgreSQL Alter Table and Long Transactions - http://www.joshuakehn.com/2017/9/9/postgresql-alter-table-and-long-transactions.html
- Adding foreign keys with zero downtime - https://travisofthenorth.com/blog/2017/2/2/postgres-adding-foreign-keys-with-zero-downtime
- Zero-downtime Postgres migrations, the hard parts - https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/

## Writing Schemas

### All schemas/migrations should have motivating queries.

**Rationale**: Queries are the reason for making the schema, so you should start with the semantic queries you're trying to do.

Luckily, we use `sqlc`, and all queries are named, so please use semantic names, with the guide below.

### Migrations

- Migrations should:
  - Be backwards compatible when possible, so that a failed migration does not break prod.
  - Allow rollbacks when possible, in case there are major issues with the migration.
  - Split schema changes from the usage of the schema changes so that reverting usage implementation does not require a down migration.
    - Destructive schema changes (removing a column) should be preceded by removing the usage of that column.
    - Additive schema changes (adding a column) should precede the usage of the new column.
  - Not lock DB tables for a significant period of time, as these can affect prod.
    - `ACCESS EXCLUSIVE` locks should have a short timeout, to avoid locking a table for too long and preventing access to it.
    - Examples of operations to be careful with:
      1. Adding default value for a [volatile default value](https://www.postgresql.org/docs/11/ddl-alter.html#DDL-ALTER-ADDING-A-COLUMN) (such as current timestamp)
      2. Adding a new index
         - You may need to create the index nonconcurrently to avoid locking the table.
      3. Adding a new foreign key or reference
         - You may need to first add the constraint without validation, then validate the constraint separately.
         - Note that Postgres will iterate through every row of both tables to validate a foreign key constraint, even if one table is empty.
      4. Any other long running ALTER TABLE query
    - Large data migrations can also lock DB tables, and should be avoided.
  - Migrate data nonconcurrently when possible.
    - In some cases, consider using a cron job to migrate the data in chunks over time.
- See Resources section for more information.

### Indexes are just as important as the table schema.

**Rationale**: Indexes make accessing databases fast.

When designed correctly, good indexes will allow answering almost all queries without accessing disk. Bad queries can easily consume all the CPU and Disk access resources, blocking all access for other processes.

See the [Resources](#resources) section for designing and picking indexes.

- All queries should be using indexes for a majority of work

  - Only rarely go to full table scans to find data

- Too many indexes can be as bad as having too few

  - Wasted effort updating indexes on any inserts/updates.

#### Don't use OFFSET for pagination

https://use-the-index-luke.com/no-offset

#### Foreign references

TODO: Need to determine policy

#### Primary keys

Use `bigserial`/`bigint`. Not trying to save space on IDs.

#### Modification timestamp columns

- `created_at`

  - Tables that are added to.

- `updated_at`

  - Tables that need modification.
  - Must have associated `Update*` query.

- `deleted_at`

  - Tables with soft-deletes.
    - Objects related to patient care in any capacity **MUST** be soft-deleted for HIPAA compliance.
  - Must have associated `Delete*` query.

### Query naming

Use standardized naming for `sqlc` queries.

- `GetThing :one`

  ```sql
  -- GetThing :one
  SELECT ... LIMIT 1
  ```

  - Unique index?
  - Sorting?

- `GetLatestThing :one` / `GetOldestThing :one`

  ```sql
  -- GetLatestThing :one
  SELECT ... ORDER BY created_at DESC ... LIMIT 1
  ```

  - Sorted index?
  - Correct ASC/DESC index selection?
  - Often used with limits on created_at horizon.

- GetThingForStuff :one

  ```sql
  -- GetThingForStuff :one
  SELECT ... WHERE stuff_id = $1 ORDER BY ... LIMIT 1
  ```

  - Index includes `stuff_id`?

- `GetThings :many`

  ```sql
  -- GetThings :many
  SELECT ... LIMIT N
  ```

  - Includes limits?

- `AddThing :one`

  ```sql
  -- AddThing :one
  INSERT ... RETURNING *
  ```

- `UpsertThing :one`

  ```sql
  -- UpsertThing :one
  INSERT ON CONFLICT ON CONSTRAINT ... UPDATE RETURNING *
  ```

  - Conflict constraint?
  - Ref: https://www.postgresqltutorial.com/postgresql-upsert/

- `UpsertThings :many`

  ```sql
  -- UpsertThings :many
  INSERT ON CONFLICT ON CONSTRAINT ... UPDATE RETURNING *
  ```

  - Conflict constraint?
  - Ref: https://www.postgresqltutorial.com/postgresql-upsert/

- `UpdateThing :one`

  ```sql
  -- UpdateThing :one
  UPDATE
      stuff
  SET
      ...
      updated_at = CURRENT_TIMESTAMP
  WHERE ...
  RETURNING *
  ```

  - Index on `WHERE` clause?

- `UpdateThings :many`

  ```sql
  -- UpdateThings :many
  UPDATE
      stuff
  SET
      ...
      updated_at = CURRENT_TIMESTAMP
  WHERE ...
  RETURNING *
  ```

  - Index on `WHERE` clause?

- `DeleteThing :exec`

  ```sql
  -- DeleteThing :exec
  DELETE ... WHERE ...
  ```

  - Limitation with `WHERE`?
  - Needs soft-delete / `deleted_at`?

## Creating a Read Only Aptible Replica for Data Engineering

1. It is recommended to be running Postgres 13 or later. If an upgrade is needed, follow the steps documented here (https://deploy-docs.aptible.com/docs/logical-replication) to perform the upgrade.
2. Create a read only replica by running `aptible db:replicate <prod-db-name> <prod-db-name>-replica`. This command is documented here (https://deploy-docs.aptible.com/docs/cli-db-replicate).
3. Tunnel into the database before adding a read only user. `aptible db:tunnel <prod-db-name>`
4. Add a user for data engineering to you primary database. LastPass can be used to generate a sufficiently long and random password.

   ```sql
   CREATE USER de_read_only WITH PASSWORD 'YOUR_CHOICE';
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO de_read_only;
   ```

5. Connect to the replica database and adjust the delay settings to facilitate bulk extraction queries.

   ```sql
   SHOW max_standby_streaming_delay; -- '30s'
   SHOW max_standby_archive_delay; -- '30s'

   ALTER SYSTEM SET max_standby_archive_delay = '1h';
   ALTER SYSTEM SET max_standby_streaming_delay = '1h';

   SELECT pg_reload_conf();

   SHOW max_standby_streaming_delay; -- Should say '1hr'
   SHOW max_standby_archive_delay; -- Should say '1hr'
   ```

6. Create an endpoint for Data Engineering. Login into the Aptible admin console, locate the new replica, and click Add Endpoint. Add the Data Engineering IPs and click save. Data OPs IPs are located here [data_ops_ips](../infra/environments/terraform-aws-production/us-west-2/default/vpc/ip_locals.tf).
7. Share the Connection URL for the replica Endpoint, which can be copied from Aptible, with Data Engineering using LastPass or another secure mechanism. If you copy from Aptible, replace the user and password with the values created in the previous step.
