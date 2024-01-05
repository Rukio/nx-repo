#!/usr/bin/env bash
# This script runs the http server from the grpc_proxy tool in the py directory

grpcproxydir="$PWD/py/tools/grpc_proxy"
cd "$grpcproxydir" || exit

poetry install
# GIT_SHA is assumed to only exist in the docker env, so if empty assume we are local and can call git
git_sha=$GIT_SHA
git_sha="${git_sha:=$(git rev-parse HEAD)}"

if [[ -z "${DD_SERVICE}" ]]; then
  local_dd_service_name="local-test-http"
else
  local_dd_service_name="${DD_SERVICE}-http"
fi
echo "running with grpc-proxy server with DD_SERVICE=$local_dd_service_name"

DD_SERVICE=$local_dd_service_name \
GIT_SHA=$git_sha \
poetry run ddtrace-run python grpc_proxy/server.py
