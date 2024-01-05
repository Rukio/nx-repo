# Modality Service

This service provides API for:

- getting all modalities
- managing modality configs
- calculate modalities for care request (based on modality configs)

### Running Modality Service Server

```sh
# Will startup database and migrate schema as necessary.
make build-go-modality-service ensure-dev-db-modality && \
    DATABASE_URL=postgres://postgres@localhost:5433/modality env $(xargs < .env.development.local) generated/bin/go/cmd/modality-service/modality-service \
        --grpc-listen-addr :8092 \
        --http-listen-addr :8093
```
