#!/bin/sh
# Environment variables must be set in aptible config to be visible
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-5m}"
SEED_CALCULATED_METRICS_ON_SERVER_START="${SEED_CALCULATED_METRICS_ON_SERVER_START:-false}"
SEED_STAGING_METRICS_ON_SERVER_START="${SEED_STAGING_METRICS_ON_SERVER_START:-false}"
COMPLETED_CARE_REQUESTS_THRESHOLD="${COMPLETED_CARE_REQUESTS_THRESHOLD:-80}"
ALLOWED_HTTP_ORIGINS="${ALLOWED_HTTP_ORIGINS:-https://performance-hub-\*.*company-data-covered*.com}"

/app \
  "--allowed-http-origins=$ALLOWED_HTTP_ORIGINS" \
  "--station-url=$STATION_URL" \
  "--health-check-interval=$HEALTH_CHECK_INTERVAL" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--auth0-audience=$AUTH0_AUDIENCE" \
  "--completed-care-requests-threshold=$COMPLETED_CARE_REQUESTS_THRESHOLD" \
  "--opa-url=$OPA_URL" \
  "--dev-mode=$DEV_MODE"
