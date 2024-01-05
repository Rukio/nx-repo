#!/bin/bash

# This script starts Tonic data generation. We expect to run this nightly as a cronjob in order to perform
# regular exports of de-identified data.

# Arguments:
while [ $# -gt 0 ]; do
    case "$1" in
        --tonic-workspace-id)
            tonic_workspace_id="${2}"
            shift
            ;;
        --tonic-base-url)
            tonic_base_url="${2}"
            shift
            ;;
        *)
            echo 'ERROR: Invalid argument(s). Expected arguments: --tonic-workspace-id --tonic-base-url'
            exit 1
    esac
    shift
done

if [ -z "$tonic_workspace_id" ]; then
    echo 'ERROR: Missing argument --tonic-workspace-id'
    exit 1
fi
if [ -z "$tonic_base_url" ]; then
    echo 'ERROR: Missing argument --tonic-base-url'
    exit 1
fi

# Env variables:
if [[ -z "$TONIC_API_KEY" ]]; then
    echo 'ERROR: Missing ENV TONIC_API_KEY'
    exit 1
fi

# Start Tonic data generation
curl \
    --request POST "$tonic_base_url/api/GenerateData/start?workspaceId=$tonic_workspace_id&strictMode=NotStrict" \
    --header "Authorization: $TONIC_API_KEY" \
    --header "Content-Type: application/json" \
    --fail \
    --data-raw '' \
    || (echo 'ERROR: Data generation failed' && exit 1)
