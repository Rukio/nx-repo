#!/usr/bin/env bash
set -eo pipefail

# Default development mode flags
STATION_URL=http://localhost:3000
SEED_CALCULATED_METRICS_ON_SERVER_START=true
SEED_STAGING_METRICS_ON_SERVER_START=false
SEED_LOOK_BACK_METRICS_ON_SERVER_START=false
DATABASE_URL="postgres://postgres@localhost:5433/clinicalkpi?sslmode=disable"

# Build the service binary
make build-go-clinicalkpi-service

# Source local env variables
set -a
source "$PWD/.env.development.local"
set +a

# Ensure the database is up and migrations are applied
DATABASE_URL="$DATABASE_URL" make ensure-dev-db-clinicalkpi

# Execute the binary
DATABASE_URL="$DATABASE_URL" generated/bin/go/cmd/clinicalkpi-service/clinicalkpi-service \
  --station-url="$STATION_URL" \
  --seed-calculated-metrics="$SEED_CALCULATED_METRICS_ON_SERVER_START" \
  --seed-staging-metrics="$SEED_STAGING_METRICS_ON_SERVER_START" \
  --seed-look-back-metrics="$SEED_LOOK_BACK_METRICS_ON_SERVER_START"
