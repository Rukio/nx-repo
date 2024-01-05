#!/bin/sh
# Environment variables must be set in aptible config to be visible
/app \
  "--allowed-http-origins=$ALLOWED_HTTP_ORIGINS" \
  "--auth0-issuer-url=$AUTH0_ISSUER_URL" \
  "--dev-mode-logging=$DEV_MODE_LOGGING" \
  "--schedule-changed-cron-expression=$SCHEDULE_CHANGED_CRON_EXPRESSION" \
  "--logistics-grpc-addr=$LOGISTICS_GRPC_ADDR" \
  "--twilio-statistics-check-url=$TWILIO_STAT_CHECK_URL" \
  "--station-url=$STATION_URL"
