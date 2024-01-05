#!/bin/sh

/app \
  "--grpc-listen-addr=$GRPC_LISTEN_ADDR" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL"
