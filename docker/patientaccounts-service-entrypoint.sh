#!/bin/sh
# Environment variables must be set in aptible config to be visible
/app \
  "--audit-service-grpc-addr=$AUDIT_SERVICE_GRPC_ADDRESS" \
  "--patients-service-grpc-addr=$PATIENTS_SERVICE_GRPC_ADDRESS" \
  "--patients-auth0-issuer-url=$AUTH0_PATIENTS_ISSUER_URL" \
  "--internal-auth0-issuer-url=$AUTH0_INTERNAL_ISSUER_URL" \
  "--policy-service-http-addr=$POLICY_SERVICE_BASE_URL"
