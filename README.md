# Monorepo

## Docs

See `docs/` directory for major documents

- [Architecture](docs/architecture)
- [Code Guides](docs/code)

See Confluence for higher level information about building and maintaining services:

- [Product Up: An Engineer's Guide to Building Services](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/126386301/Product+Up+An+Engineer+s+Guide+to+Building+Services)
- [Product Down: An Engineer's Emergency Guide](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/3345965/Product+Down+An+Engineer+s+Emergency+Guide)
- [Platforms used at _company-data-covered_](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/110166026/Platforms+used+at+*company-data-covered*)

## Development

All major day-to-day work should be able to use the base [`Makefile`](Makefile) to run command lines.

### One-time setup of tools

- Safe to re-run if tools are missing

```sh
# MacOS
make setup-mac

# Linux
make setup-linux
```

### Normal development

```sh
# Displays information about available commands
make help

# Cleanup all generated files and builds
make clean

# Run a Go server
make run-go-logistics-service

# Run a Docker compose file
make run-docker-osrm

# Test a Go server
make test-go-logistics-service
# Test a Go pkg directory
make test-go-pkg-logistics
# Test a Go server with DB tests
BASE_DATABASE_URL=postgres://postgres@localhost:5433/?sslmode=disable make test-db-go-logistics-service

# Benchmark a Go server with DB tests, using BenchmarkPattern
BENCH=BenchmarkPattern DATABASE_URL=postgres://postgres@localhost:5433/logistics make benchmark-db-go-logistics-service
# Benchmark a Go pkg directory with DB tests, using BenchmarkPattern
BENCH=BenchmarkPattern DATABASE_URL=postgres://postgres@localhost:5433/logistics make benchmark-db-go-pkg-logistics

# Run a TS application
make run-ts-example-react-app

# Build a TS application or library
make build-ts-example-react-app

# Test a specific TS application or library
make test-ts-example-library

# Test all TS applications or libraries
make test-ts

# Run E2E tests for a specific TS application or library
make test-ts-e2e-example-react-app

# Run E2E tests in watch mode for a specific TS application or library
make test-ts-e2e-watch-example-react-app

# Auto format code
make format

# Auto lint code
make lint

# Auto lint a specific technology group: `lint-<technology>`
make lint-go
make lint-json
make lint-docker

# Test all Go code, excluding database tests.
make test-go

# Test all Go code, including database tests.
BASE_DATABASE_URL=postgres://postgres@localhost:5433/?sslmode=disable make clean-dev-db ensure-dev-db test-db-go
```

### GRPC Debugging

Use [gRPCurl](https://github.com/fullstorydev/grpcurl) to interact with GRPC server.

[Usage Instructions](https://github.com/fullstorydev/grpcurl#usage)

```sh
# Find available methods, for servers supporting GRPC reflection
bin/grpcurl -plaintext localhost:8081 list

# Invoke RPC
bin/grpcurl -plaintext localhost:8081 example.ExampleService/GetVersion

# Invoke RPC with arguments
bin/grpcurl -plaintext -d '{"patient_id": "asdf"}' localhost:8081 patients.PatientsService/GetPatient

# Invoke RPC with json from file
bin/grpcurl -plaintext -d @ localhost:8081 optimizer.OptimizerService/SolveVRP < vrp-problem.json

# In case of proto resolution failure
make gen-proto
bin/grpcurl -plaintext -protoset generated/all.protoset localhost:8081 list

# If authentication is enabled
# Make a request to Auth0 to get the access token, after setting client ID and client secret
 curl --request POST \
  --url https://staging-auth.*company-data-covered*.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{"client_id":"EXAMPLE_AUTH0_CLIENT_ID","client_secret":"EXAMPLE_AUTH0_CLIENT_SECRET","audience":"patients-service.*company-data-covered*.com","grant_type":"client_credentials"}'
# Then, copy/paste the access token and overwrite EXAMPLEAUTHKEY
bin/grpcurl -H 'authorization: Bearer EXAMPLEAUTHKEY' -d '{"patient_id": "asdf"}' localhost:8081 patients.PatientsService/GetPatient

```

To communicate with a gRPC server hosted on Aptible:

```sh
aptible ssh --app dashboard-qa
cd /tmp
apt install wget
wget https://github.com/fullstorydev/grpcurl/releases/download/v1.8.6/grpcurl_1.8.6_linux_x86_64.tar.gz
tar -xzf grpcurl_1.8.6_linux_x86_64.tar.gz

# Make a request to Auth0 to get the access token, after setting client ID and client secret
 curl --request POST \
  --url https://staging-auth.*company-data-covered*.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{"client_id":"EXAMPLE_AUTH0_CLIENT_ID","client_secret":"EXAMPLE_AUTH0_CLIENT_SECRET","audience":"logistics-service.*company-data-covered*.com","grant_type":"client_credentials"}'

./grpcurl -plaintext -H 'authorization: Bearer EXAMPLEAUTHKEY' -d '' logistics-service-qa.*company-data-covered*.com:8081 logistics.LogisticsService.GetVersion
```

If you are making a `grpcurl` request to a gRPC server without reflection (all Ruby gRPC servers), you will have to include all relevant proto files (including dependencies). On local, these are available in the `proto/` directory; in Aptible, you will have to bring them over yourself.

```sh
# In local
bin/grpcurl -proto station_patients/service.proto -import-path proto -plaintext -H "authorization: Bearer blahblahtoken" -d '{"patient_id": "1157448"}' localhost:9001 station_patients.StationPatientsService/GetPatient

# On Aptible
aptible ssh --app dashboard-qa
cd /tmp
apt install wget
wget https://github.com/fullstorydev/grpcurl/releases/download/v1.8.6/grpcurl_1.8.6_linux_x86_64.tar.gz
tar -xzf grpcurl_1.8.6_linux_x86_64.tar.gz
apt install vim
# Copy paste proto files into /tmp
vim station_patients/service.proto
vim station_patients/patient.proto
vim audit/audit.proto
./grpcurl -proto station_patients/service.proto -import-path /tmp -plaintext -H "authorization: Bearer blahblahtoken" -d '{"patient_id": "1157448"}' qa-station-grpc.*company-data-covered*.com:9001 station_patients.StationPatientsService/GetPatient
```

### Database

#### Local development database

Run a local database in docker.

```sh
# Ensure a service database exists with all migrations for a single database schema ("logistics") and waits for it to be accepting connections.
# If necessary, an empty database in docker will be created.
# Also automatically dumps the whole schema to disk.
make ensure-dev-db-logistics

# Ensure database exists with all migrations for all database schemas and waits for them to be accepting connections.
# If necessary, an empty database in docker will be created.
# Also automatically dumps the whole schema to disk.
make ensure-dev-db

# Connect to the database with psql
make connect-dev-db-logistics

# Run all downward migrations
make reset-dev-db

# Bring down and clean up databases
make clean-dev-db

# Bring down the Postgres instance without cleaning the databases
make stop-dev-db

# Putting it all together...
# Ensure completely fresh database to test database code.
#
# Tests can use either DATABASE_URL or BASE_DATABASE_URL.
# DATABASE_URL: Tests will use this exact url, without modification.
# BASE_DATABASE_URL: Tests will use the preferred database schema ("logistics") specified in the test.
BASE_DATABASE_URL=postgres://postgres@localhost:5433/?sslmode=disable make clean-dev-db ensure-dev-db-logistics test-db-go-logistics-service
```

#### Environment Variables

Download the latest `.env.development.local` file from AWS SecretsManager. Requires AWS_SECRET_ACCESS_KEY; if you don't have one, obtain one from another developer via LastPass or other similarly secure mechanism. New environment variables can be added to the
development `.env.development.local` file through the [us-east-2 AWS staging console](https://us-east-2.console.aws.amazon.com/secretsmanager/home?region=us-east-2#!/listSecrets/).

```sh
make setup-env-vars
```

#### Migrations

You can create/manage database migrations to a service database passing the service name to
the corresponding task. Please make sure you have a `DATABASE_URL` ENV var set for the service database.

Examples use `logistics` as service name.

```sh
# set DATABASE_URL as ENV var
export DATABASE_URL=postgres://postgres@localhost:5433/logistics?sslmode=disable

# Create db schema migration file on service database
# requires name={migrationName} argument
make db-create-migration-logistics name=create_users

# Applies all db schema migrations to service database
make db-migrate-logistics
# Applies db schema migrations up to and including the TARGET_DATABASE_VERSION
TARGET_DATABASE_VERSION=20220531144553 make db-migrate-logistics

# Rolls back last db schema migration from service database
make db-rollback-logistics
# Rolls back to TARGET_DATABASE_VERSION version of db schema.
TARGET_DATABASE_VERSION=20220531144553 make db-rollback-logistics

# Prints db schema migration status for service database
make db-status-logistics
```

### Build Docker images

```sh
# Build docker image for current CPU architecture
make docker-build-go-logistics-service

# Build docker image for specific CPU architecture
DOCKER_TARGET_ARCH=linux/amd64 make docker-build-go-logistics-service

# Run built docker image
docker run --rm logistics-service
```

### Run Monitoring (InfluxDB and Grafana)

```sh
# M1/ARM64-ONLY: Build influxdb locally, as not image not available on Dockerhub
git clone git@github.com:influxdata/influxdata-docker.git
cd influxdb/1.8
docker build -t influxdb:1.8-alpine .

# Bring up InfluxDB and Grafana in Docker
make ensure-dev-monitoring

# Bring up your service
INFLUXDB_DB=test INFLUXDB_URL=http://localhost:8086 make run-go-patients-service

# Connect to InfluxDB to inspect content
make connect-dev-monitoring

# Bring down InfluxDB and Grafana in Docker
make clean-dev-monitoring
```

### Run Elasticsearch

```sh
# Bring up Elasticsearch in Docker using port defined in makefile var DEV_ELASTICSEARCH_PORT
make ensure-dev-elasticsearch

# Bring down Elasticsearch in Docker
make clean-dev-elasticsearch
```

### Run Kafka

```sh
# Bring up Kafka in Docker using port defined in makefile var DEV_KAFKA_PORT and DEV_ZOOKEEPER_PORT
make ensure-dev-kafka

# Bring down Kafka in Docker
make clean-dev-kafka
```

For more information, go to [`the example service README`](go/cmd/example-service/README.md).

### Run Redis

```sh
# Bring up Redis in Docker using port defined in makefile var DEV_REDIS_PORT
make ensure-dev-redis

# Bring down Redis in Docker
make clean-dev-redis
```

### Run OPA

**Note: OPA is still currently under review and is undergoing testing as a policy engine.**

OPA policies and data are defined in the directory defined by `OPA_BUNDLE` (`opa/bundle`).
The Rego policies and JSON data defined here will be added to the custom OPA image during the build process.
The OPA service will load this bundle on start up.

```sh
# Bring up OPA in Docker using port defined in makefile var DEV_OPA_PORT (default: 8181)
make ensure-dev-opa

# Bring down OPA in Docker
make clean-dev-opa
```

## Utilities

Add the `utils/` directory to your `PATH` for convenient tools.

### Git tools

Can be used as integrated `git` command `git branch-clean`, `git trunk-diff` when on `PATH`

- `git-branch-clean` - Clean up merged branches from local repository.
- `git-trunk-diff` - Diff against `trunk` branch at common ancestor, to only show diffs for your branch, that do not require checking newest `trunk`. Similar to Github PR diff.
