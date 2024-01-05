#!/bin/sh

ENABLE_REDIS="${ENABLE_REDIS:-false}"
ENABLE_INSURANCE_ELIGIBILITY_CHECK="${ENABLE_INSURANCE_ELIGIBILITY_CHECK:-false}"

/app \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--athena-auth-url=$ATHENA_AUTH_URL" \
  "--audit-service-grpc-addr=$AUDIT_SVC_GRPC_ADDR" \
  "--enable-redis=$ENABLE_REDIS" \
  "--enable-insurance-eligibility-check=$ENABLE_INSURANCE_ELIGIBILITY_CHECK"
