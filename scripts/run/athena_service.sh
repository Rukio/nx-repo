#!/usr/bin/env bash
set -euo pipefail

# TODO: Replace this script with Docker once it's ready.
# Build services to clean and generate necessary proto (and other) files.
make build-go-audit-service build-go-athena-service
(make ensure-dev-db-audit && DATABASE_URL=postgres://postgres@localhost:5433/audit make nobuild-run-go-audit-service) &
(make nobuild-run-go-athena-service) &
wait
