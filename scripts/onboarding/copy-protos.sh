#!/bin/bash
set -euo pipefail

CURR_DIR=$(pwd)
ONBOARDING_API_DIR="${CURR_DIR}/ts/apps/nest/onboarding-api/src/proto"

rm -rf "${ONBOARDING_API_DIR}"

echo "copying protos from ${CURR_DIR}/proto into ${ONBOARDING_API_DIR}"

cp -R proto/ "${ONBOARDING_API_DIR}"
