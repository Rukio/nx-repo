# Insurance Service

This service provides an API for managing insurance payer and network data.

### Running Insurance Service Server

```sh
# Will startup database and migrate schema as necessary.
make build-go-insurance-service ensure-dev-db-insurance && \
    DATABASE_URL=postgres://postgres@localhost:5433/insurance env $(xargs < .env.development.local) generated/bin/go/cmd/insurance-service/insurance-service \
        --grpc-listen-addr :8096 \
        --http-listen-addr :8097
```
