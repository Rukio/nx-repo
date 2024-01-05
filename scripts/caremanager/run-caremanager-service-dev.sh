#!/usr/bin/env bash
set -eo pipefail

# Default development mode flags
DEV_MODE=true
GRPC_LISTEN_ADDR=:8800

# Build the service binary
make build-go-caremanager-service

# Source local env variables
set -a
source "$PWD/.env.development.local"
set +a

# Execute the binary
generated/bin/go/cmd/caremanager-service/caremanager-service \
  --auth0-audience="$CAREMANAGER_SERVICE_AUTH0_AUDIENCE" \
  --auth0-issuer-url="$AUTH0_ISSUER_URL" \
  --dev-mode="$DEV_MODE" \
  --grpc-listen-addr="$GRPC_LISTEN_ADDR"
