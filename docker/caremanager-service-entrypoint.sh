#!/bin/sh
# Environment variables must be set in aptible config to be visible
/app \
  "--allowed-http-origins=$ALLOWED_HTTP_ORIGINS" \
  "--audit-service-grpc-addr=$AUDIT_SERVICE_GRPC_ADDRESS" \
  "--logistics-service-grpc-addr=$LOGISTICS_SERVICE_GRPC_ADDRESS" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--auth0-audience=$AUTH0_AUDIENCE" \
  "--auth0-audit-service-audience=$AUTH0_AUDIT_SERVICE_AUDIENCE" \
  "--auth0-logistics-service-audience=$AUTH0_LOGISTICS_SERVICE_AUDIENCE" \
  "--station-url=$STATION_URL" \
  "--station-grpc-addr=$STATION_GRPC_ADDRESS"
