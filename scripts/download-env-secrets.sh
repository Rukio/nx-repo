#!/usr/bin/env bash
set -euo pipefail

# This script downloads the values for the application environment
# files from AWS.

OUTFILE=.env.development.local

# In order to get access, you need to get the AWS secret key. If you
# don't have access to the key, see README for instructions on how to
# get it.
export AWS_ACCESS_KEY_ID=AKIAXW23DET2WCCIFCFD

# See if the ENVAR_AWS_SECRET_KEY ENV var is set.  If so, use it
# to avoid conficting with the user's normal AWS_SECRET_ACCESS_KEY
# just for this script.
if [ -n "$ENVAR_AWS_SECRET_KEY" ]; then
  export AWS_SECRET_ACCESS_KEY="$ENVAR_AWS_SECRET_KEY"
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "AWS_SECRET_ACCESS_KEY not set, either set it directly "
  echo "or set ENVVAR_AWS_SECRET_KEY to the proper value. See "
  echo "README for instructions."
  exit 255
fi
export AWS_DEFAULT_REGION=us-east-2

secrets=$(aws secretsmanager get-secret-value \
            --output "json" \
            --secret-id "services_env-dev" | \
          jq -r '.SecretString' | \
          jq '. | to_entries[] | join("=")' | \
          jq -r '.')

echo "${secrets}" > "${OUTFILE}"
