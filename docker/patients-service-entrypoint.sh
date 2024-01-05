#!/bin/sh
# Environment variables must be set in aptible config to be visible
/app \
  "--station-url=$STATION_URL" \
  "--audit-service-grpc-addr=$AUDIT_SERVICE_GRPC_ADDRESS" \
  "--athena-service-grpc-addr=$ATHENA_SERVICE_GRPC_ADDRESS" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--station-patients-service-grpc-addr=$STATION_PATIENTS_SERVICE_GRPC_ADDR"
