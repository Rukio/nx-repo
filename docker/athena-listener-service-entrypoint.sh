#!/bin/sh

/app \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--athena-service-grpc-addr=$ATHENA_SVC_GRPC_ADDR" \
  "--audit-service-grpc-addr=$AUDIT_SVC_GRPC_ADDR" \
  "--enable-redis=$ENABLE_REDIS" \
  "--listener-polling-interval=$LISTENER_POLLING_INTERVAL" \
  "--leave-unprocessed=$LEAVE_UNPROCESSED" \
