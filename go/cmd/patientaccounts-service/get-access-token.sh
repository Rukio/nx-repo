#!/usr/bin/env bash

set -euo pipefail

if [ ! -f .env.local.development ]; then
    # shellcheck disable=SC2002,SC2046
    export $(cat .env.development.local | xargs)
else
    echo "Please download local environment variables to populate .env.local.development"
    exit 0
fi

domain="dev-patients-auth.*company-data-covered*.com"
host="https://${domain}"
audience="patients.*company-data-covered*.com"
client_id="$PATIENT_ACCOUNTS_LOCAL_DEV_CLIENT_ID"
client_secret="$PATIENT_ACCOUNTS_LOCAL_DEV_CLIENT_SECRET"

email=$1
if [ -z "$email" ]; then
    echo "Provide the user email you'd like to login with."
    read -rp "Enter email: " email
fi

curl -s --request POST \
    --url "${host}/passwordless/start" \
    --header 'content-type: application/json' \
    --data "{\"client_id\":\"${client_id}\", \"client_secret\":\"${client_secret}\", \"connection\":\"email\", \"email\":\"${email}\", \"send\":\"code\", \"authParams\":{\"scope\": \"openid\",\"state\": \"cli\"}}" >/dev/null

res_code=$?
if test "$res_code" != "0"; then
    echo "Failed to trigger OTP with error code: $res_code"
fi

# promt for code
echo "A code has been sent to the provided email."
read -rp "Enter code: " code

r=$(curl -s --request POST \
    --url "${host}/oauth/token" \
    --header 'content-type: application/json' \
    --data "{\"grant_type\":\"http://auth0.com/oauth/grant-type/passwordless/otp\", \"client_id\":\"${client_id}\", \"client_secret\":\"${client_secret}\", \"otp\":\"${code}\", \"realm\":\"email\", \"username\":\"${email}\", \"audience\":\"${audience}\", \"scope\":\"openid\"}")

res_code=$?
if test "$res_code" != "0"; then
    echo "Failed to validate OTP with error code: $res_code"
fi

access_token=$(echo "$r" | jq '.access_token')
expires_in=$(echo "$r" | jq '.expires_in')
echo "Your access token is:"
echo "$access_token"

seconds=$((expires_in % 60))
minutes=$(((expires_in / 60) % 60))
hours=$((expires_in / 60 / 60))
echo "It expires in ${hours}h${minutes}m${seconds}s."

exit 0
