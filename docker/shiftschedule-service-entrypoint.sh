#!/bin/sh
# Environment variables must be set in aptible config to be visible
/app \
  "--allowed-http-origins=$ALLOWED_HTTP_ORIGINS" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--station-url=$STATION_URL"
