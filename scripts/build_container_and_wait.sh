#!/bin/bash

# This script can be used to check if a service was built using github actions yet.
# It does this by using the github cli to get the provided services workflow and check the runs associated.
# If a run can be found on the branch for the specified sha, the script will exit 0.
# If it cannot find a build for the specified branch/sha combination, the script will create a workflow_dispatch event
# via the github cli to run the build workflow for the provided service on the specified branch with the specified sha.
# It will then wait for that workflow to complete before gracefully exiting. If the build fails, the script will also fail

set -eo pipefail

function usage() (
  echo "$0 [flags]" >&2
  echo "" >&2
  echo "flags:" >&2
  echo "-h, --help                         print this message and exit" >&2
  echo "-n, --service-name=<service_name>  the name of the service to build. Example: logistics-service" >&2
  echo "-b, --branch=<git_branch>          the branch name to build" >&2
  echo "-s, --sha=<git_sha>                the sha to build" >&2
  echo "--build                            trigger the build workflow if a build is not currently running" >&2
)


SERVICE_NAME=""
BRANCH=""
SHA=""
BUILD_IF_NOT_FOUND=false

while test $# -gt 0; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    -n|--service-name)
      shift
      if test $# -gt 0; then
        SERVICE_NAME=$1
      else
        echo "no service specified"
        usage
        exit 1
      fi
      shift
      ;;
    -b|--branch)
      shift
      if test $# -gt 0; then
        BRANCH=$1
      else
        echo "no branch specified"
        usage
        exit 1
      fi
      shift
      ;;
    -s|--sha)
      shift
      if test $# -gt 0; then
        SHA=$1
      else
        echo "no sha specified"
        usage
        exit 1
      fi
      shift
      ;;
    --build)
      BUILD_IF_NOT_FOUND=true
      shift
      ;;
  esac
done

serviceNameWithSpaces=${SERVICE_NAME//-/ }


if [[ -z "$SERVICE_NAME" || -z "$BRANCH" || -z "$SHA" ]]; then
  usage
  exit 1
fi

# get build workflow
echo "Find build workflow..."
workflow=$(gh workflow list | grep -i "build $serviceNameWithSpaces")
if [[ -z "$workflow" ]]; then
  echo "::error::Could not find build workflow for $SERVICE_NAME"
  exit 1
fi

workflowID=$(echo "$workflow" | awk '{ print $NF }')
workflowName=$(echo "$workflow" | awk '{ for(i=1; i<=NF-2; i++) {ORS=" "; print $i}}')
echo "Found workflow: $workflowName($workflowID)"

# Check if there's already a run
runs=$(gh run list -w "$workflowID" -b "$BRANCH" --json conclusion,status,url,databaseId,displayTitle)
run=$(echo "$runs" | jq --arg sha "$SHA" '.[] | select( .displayTitle | contains($sha))')

# If theres a run in progress, wait for it to finish
if [[ -n "$run" ]]; then
  runURL=$(echo "$run" | jq -r '.url')
  echo "Build run for $SERVICE_NAME:$SHA found - $runURL"
  status=$(echo "$run" | jq -r '.status')
  conclusion=$(echo "$run" | jq -r '.conclusion')
  echo "Build status: $status"
  echo "Build conclusion: $conclusion"

  if [[ "$status" == "completed" ]]; then
    if [[ "$conclusion" == "success" ]]; then
      echo "Build for $SERVICE_NAME:$SHA was already successfully run"
      exit 0
    else
      echo "::error::Build for $SERVICE_NAME:$SHA failed - $runURL"
      exit 1
    fi
  else
    runID=$(echo "$run" | jq -r '.databaseId')
    gh run watch "$runID" --exit-status --interval 10
    exit 0
  fi
else
  echo "Could not find build for $SERVICE_NAME:$SHA"
  if ! $BUILD_IF_NOT_FOUND; then
    echo "Not building image as flag --build was not specified" >&2
    echo "To build the image in a github actions run, rerun the workflow and check the box 'Trigger build if image or build run not found?'" >&2
    exit 1
  fi
fi


if $BUILD_IF_NOT_FOUND; then
  # Create dispatch event
  echo "Dispatching workflow"
  gh workflow run "$workflowID" --ref "$BRANCH" -f ref="$SHA"

  # wait a bit for workflow to start
  sleep 10

  # Get build run
  runs=$(gh run list -w "$workflowID" -b "$BRANCH" --json url,databaseId,displayTitle)
  run=$(echo "$runs" | jq --arg sha "$SHA" '.[] | select( .displayTitle | contains($sha))')
  runID=$(echo "$run" | jq -r '.databaseId')
  runURL=$(echo "$run" | jq -r '.url')

  # Watch run
  echo "Watching build - $runURL"
  gh run watch "$runID" --exit-status --interval 10
fi