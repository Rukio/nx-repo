#!/bin/sh
# Environment variables must be set in aptible config to be visible
/app \
  "--allowed-http-origins=$ALLOWED_HTTP_ORIGINS" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--station-auth0-audience=$AUTH0_STATION_AUDIENCE" \
  "--auth0-audience=$AUTH0_AUDIENCE"
