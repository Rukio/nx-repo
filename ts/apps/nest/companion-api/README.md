# Companion API <!-- omit in toc -->

Serves as the backend for the Companion application.

## Table of Contents <!-- omit in toc -->

- [Development](#development)
- [Resources](#resources)
- [API Documentation](#api-documentation)
- [Metrics](#metrics)
- [Working with Prisma](#working-with-prisma)

## Development

```
# Run database and server
make run-dev-db run-ts-companion-api
```

For additional instructions on how to run the service, tests, and lint, see [here](../../../../README.md#normal-development).

## Resources

- [Runbook](https://confluence.*company-data-covered*.com/pages/viewpage.action?spaceKey=DEV&title=Consumer+API+Runbook): Information for handling production system-downs for issues involving the Patient API.

## API Documentation

API documentation is built using the Swagger plugin for NestJS. It is hosted with the application when the application is running locally at the following links:

- Swagger UI Documentation: <http://localhost:3030/documentation>
- OpenAPI Specification: <http://localhost:3030/documentation-json>

## Metrics

This application sends metrics to Datadog. See the runbook linked under [Resources](#resources) for details.

## Working with Prisma

Prisma is the ORM used by this application to interact with a PostgreSQL database. It has the capability to handle seeding the database, generating migration files as the schema changes, and resetting the database.

See the [Prisma CLI Reference](https://www.prisma.io/docs/reference/api-reference/command-reference#db-push) for details.
