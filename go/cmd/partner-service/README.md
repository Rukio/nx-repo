# Partner Service

### Description

Partner service provides a gRPC API to search for partners, fetch partners, and calculate partner priority.

### Setup

#### Flags

- grpc-listen-addr (GRPC address to listen to default 8472)
- authorization-disabled (flag to disable authorization, when it is present disables auth0)
- pophealth-service-grpc-addr (Pop Health service GRPC address)
- enable-pophealth-service (Pop Health service enabled check)

### Running GRPC Server locally

```sh
# Build and run the service
# Will startup database and migrate schema as necessary.
make build-go-partner-service ensure-dev-db-partner && \
      env $(xargs < .env.development.local) generated/bin/go/cmd/partner-service/partner-service
```

# Example gRPC call

grpcurl -plaintext -d '{"partner": {"name": "Test Partner", "category_short_name": 0, "station_identifiers": {"channel_item_id": 1}}}' localhost:8472 partner.PartnerService/UpsertPartner
