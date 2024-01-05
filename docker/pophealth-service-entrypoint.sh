#!/bin/sh

ES_NUM_SEARCH_WORKERS="${ES_NUM_SEARCH_WORKERS:-10}"
ES_FLUSH_BYTES="${ES_FLUSH_BYTES:-5120}"
ES_FLUSH_INTERVAL="${ES_FLUSH_INTERVAL:-30s}"
ES_TIMEOUT="${ES_TIMEOUT:-60s}"
PREFECT_TIMEOUT="${PREFECT_TIMEOUT:-5s}"
PREFECT_CHANGE_PERCENT_LIMIT="${PREFECT_CHANGE_PERCENT_LIMIT:-25}"
PREFECT_ERROR_PERCENT_LIMIT="${PREFECT_ERROR_PERCENT_LIMIT:-5}"
PREFECT_WAIT_BETWEEN_REQUESTS="${PREFECT_WAIT_BETWEEN_REQUESTS:-15s}"
PREFECT_RETRIES_COUNT="${PREFECT_RETRIES_COUNT:-1}"
PREFECT_RETRIES_INTERVAL="${PREFECT_RETRIES_INTERVAL:-5s}"

/app \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--auth0-audience=$AUTH0_AUDIENCE" \
  "--pop-health-es-index=$ES_INDEX" \
  "--pop-health-es-backfill-index=$ES_BACKFILL_INDEX" \
  "--number-of-parallel-backfills=$NUMBER_OF_PARALLEL_BACKFILLS" \
  "--elastic-search-workers=$ES_NUM_SEARCH_WORKERS" \
  "--elastic-search-flush-bytes=$ES_FLUSH_BYTES" \
  "--elastic-search-flush-interval=$ES_FLUSH_INTERVAL" \
  "--elastic-search-timeout=$ES_TIMEOUT" \
  "--prefect-timeout=$PREFECT_TIMEOUT" \
  "--prefect-change-percent-limit=$PREFECT_CHANGE_PERCENT_LIMIT" \
  "--prefect-error-percent-limit=$PREFECT_ERROR_PERCENT_LIMIT" \
  "--prefect-wait-between-requests=$PREFECT_WAIT_BETWEEN_REQUESTS" \
  "--prefect-retries-count=$PREFECT_RETRIES_COUNT" \
  "--prefect-retries-interval=$PREFECT_RETRIES_INTERVAL" \
  "--partner-service-grpc-addr=$PARTNER_SERVICE_GRPC_ADDRESS"
