#!/bin/sh
# Environment variables must be set in aptible config to be visible
/app \
  "--allowed-http-origins=$ALLOWED_HTTP_ORIGINS" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--insurance-grpc-addr=$INSURANCE_SERVICE_GRPC_ADDR" \
  "--insurance-auth0-audience=$INSURANCE_SERVICE_AUTH0_AUDIENCE"
