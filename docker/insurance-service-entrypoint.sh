#!/bin/sh
# Environment variables must be set in aptible config to be visible
/app \
  "--allowed-http-origins=$ALLOWED_HTTP_ORIGINS" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--station-grpc-addr=$STATION_GRPC_ADDRESS" \
  "--station-url=$STATION_URL" \
  "--station-auth0-audience=$AUTH0_STATION_AUDIENCE"
