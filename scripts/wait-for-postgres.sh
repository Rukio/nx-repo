#!/usr/bin/env bash

# Wait for the local database to be ready, retrying as needed.

set -euo pipefail

RETRIES=$1
SLEEP_SEC=$2
PORT=$3

until pg_isready -h localhost -p "${PORT}"; do
    [ "$((RETRIES))" -ne "0" ] || exit 2

    echo "Waiting for postgres server, $((RETRIES--)) remaining attempts..."
    sleep "${SLEEP_SEC}"
done
