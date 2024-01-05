#!/usr/bin/env bash
# This script runs a poetry install, check for updates, and executes the server.py
# found in the passed in directory

if [ $# -ne 1 ]
    then
        echo "No server target"
        exit 1
fi

dirname=$(echo "$1" | tr '-' '_')
targetdir=$(find ./py/ -type d -name "$dirname" | head -n 1)

cd "$targetdir" || exit

if [ ! -f "$dirname/server.py" ]; then
    echo "No server.py found for $dirname"
    exit 1
fi

if ! poetry install; then
    echo "Error during install"
    exit 1
fi

if [[ -z "${DD_SERVICE}" ]]; then
  local_dd_service_name="local-test-grpc"
else
  local_dd_service_name="${DD_SERVICE}-grpc"
fi

echo "running grp-server with DD_SERVICE=$local_dd_service_name"

DD_SERVICE=$local_dd_service_name \
poetry run ddtrace-run python "$dirname/server.py"
