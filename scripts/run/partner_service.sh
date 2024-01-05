#!/usr/bin/env bash
set -euo pipefail

make build-go-audit-service build-go-athena-service build-go-patients-service build-go-partner-service build-go-pophealth-service
(make ensure-dev-db-audit && DATABASE_URL=postgres://postgres@localhost:5433/audit make nobuild-run-go-audit-service) &
(make nobuild-run-go-athena-service) &
(make ensure-dev-db-patients && DATABASE_URL="postgres://postgres@localhost:5433/patients?sslmode=disable" make nobuild-run-go-patients-service) &
(make ensure-dev-db-pophealth && DATABASE_URL=postgres://postgres@localhost:5433/pophealth make nobuild-run-go-pophealth-service) &
(make ensure-dev-db-partner && DATABASE_URL="postgres://postgres@localhost:5433/partner?sslmode=disable" make nobuild-run-go-partner-service) &
wait
