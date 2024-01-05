#!/bin/sh

/app \
  "--allowed-http-origins=$ALLOWED_HTTP_ORIGINS" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--auth0-audience=$AUTH0_AUDIENCE" \
  "--backfill-list-visits-batch-size=$BACKFILL_LIST_VISITS_BATCH_SIZE" \
  "--enable-feature-store=$ENABLE_FEATURE_STORE" \
  "--episode-service-grpc-addr=$EPISODE_SERVICE_GRPC_ADDRESS" \
  "--feature-store-feature-group-name=$FEATURE_STORE_FEATURE_GROUP_NAME" \
  "--feature-store-feature-name=$FEATURE_STORE_FEATURE_NAME" \
  "--grpc-listen-addr=$GRPC_LISTEN_ADDR" \
  "--insurance-service-grpc-addr=$INSURANCE_SERVICE_GRPC_ADDRESS" \
  "--policy-service-base-url=$POLICY_SERVICE_BASE_URL" \
  "--pophealth-service-grpc-addr=$POPHEALTH_SERVICE_GRPC_ADDRESS" \
  "--station-auth0-audience=$STATION_AUTH0_AUDIENCE"
