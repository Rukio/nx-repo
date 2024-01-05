#!/usr/bin/env bash

# Wait for the local elasticsearch instance to be ready, retrying as needed.

set -uo pipefail

RETRIES=$1
SLEEP_SEC=$2
PORT=$3
URL="http://localhost:$PORT/"

# Check that Elasticsearch is running
curl -s $URL 2>&1 > /dev/null
while [ $? -ne 0 ]; do
    [ "$((RETRIES))" -ne "0" ] || exit 2

    echo "Waiting for elasticsearch server, $((RETRIES--)) remaining attempts..."
    sleep "${SLEEP_SEC}"
    curl -s $URL 2>&1 > /dev/null
done

