# Risk Stratification Service

## Running Risk Stratification Service Server

```sh
make build-go-riskstratification-service ensure-dev-db-riskstratification && \
    DATABASE_URL=postgres://postgres@localhost:5433/riskstratification env $(xargs < .env.development.local) generated/bin/go/cmd/riskstratification-service/riskstratification-service \
        --grpc-listen-addr :8094 \
        --http-listen-addr :8095
```

## Generate OpenAPI spec

```sh
make gen-proto-openapi
```

A `service.swagger.json` file will be created in `generated/openapi/riskstratification/` directory which can be read using an OpenAPI vscode extension, or similar.

## Fetching Time Sensitive Questions

```sh
 grpcurl -plaintext localhost:8094 riskstratification.RiskStratificationService/ListTimeSensitiveQuestions
```
