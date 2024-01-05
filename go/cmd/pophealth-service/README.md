# Pophealth Service

### Overview

Pophealth service ingests population files from partners and allows ingested patients to be searched.

[Sequence Diagrams](../../../docs/architecture/pophealth/sequences.md)

### Notes on Configuration

Most env vars should be set .env.development.local after running `make setup-env-vars`. Additional set up is needed for these vars: POP_HEALTH_SERVICE_URL, DATABASE_URL.

POP_HEALTH_SERVICE_URL allows the service to receive SNS notifications, a critical piece of functionality. For local dev, first install [ngrok](https://ngrok.com/download) then run `ngrok http 8080`

Copy the https URL created by that command into POP_HEALTH_SERVICE_URL.

DATABASE_URL should be set to: `postgres://postgres@localhost:5433/pophealth`

AWS credentials will be pulled from [default locations](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) but flags (awsAccessKeyID, awsRegion, awsSecretAccessKey) can optionally be used to pass in credentials directly. Flags can be useful if you need to run multiple services with different AWS keys.

### Running GRPC Server locally

```sh
# Build and run the service
# Will startup database and migrate schema as necessary.
make build-go-pophealth-service ensure-dev-db-pophealth ensure-dev-elasticsearch && \
    env $(xargs < .env.development.local) generated/bin/go/cmd/pophealth-service/pophealth-service
```
