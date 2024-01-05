#!/bin/bash

usage() (
    {
        echo "usage: $0 --tonic-snapshot-db <dbname> --upload-bucket <bucket_name> --upload-bucket-key <bucket_key> --upload-bucket-prefix <prefix>"
        echo
        echo "This script automates the export of Tonic's SQL data and upload to S3."
        echo "We expect to run this nightly, following the tonic_setup.sh script,"
        echo "as a cronjob which automates most of the tasks associated with"
        echo "Tonic data generation."
        echo
        echo "Arguments:"
        echo "  --upload-bucket"
        echo "      The S3 bucket where the SQL dump will be uploaded."
        echo "  --upload-bucket-key"
        echo "      The S3 key, or subfolder, where the SQL dump will be uploaded."
        echo "  --upload-bucket-prefix"
        echo "      The filename prefix for the upload to S3. The file will be suffixed with today's date."
        echo
    } >&2
)

# Arguments:
while [ $# -gt 0 ]; do
    case "$1" in
        help)
            usage
            exit 1
            ;;
        --upload-bucket)
            upload_bucket="${2}"
            shift
            ;;
        --upload-bucket-key)
            upload_bucket_key="${2}"
            shift
            ;;
        --upload-bucket-prefix)
            upload_bucket_prefix="${2}"
            shift
            ;;
        *)
            echo 'ERROR: Invalid argument(s). Expected arguments: --upload-bucket --upload-bucket-key --upload-bucket-prefix'
            usage
            exit 1
    esac
    shift
done

if [[ -z "$upload_bucket" ]]; then
    echo 'ERROR: Missing argument --upload-bucket'
    usage && exit 1
fi
if [[ -z "$upload_bucket_key" ]]; then
    echo 'ERROR: Missing argument --upload-bucket-key'
    usage && exit 1
fi
if [[ -z "$upload_bucket_prefix" ]]; then
    echo 'ERROR: Missing argument --upload-bucket-prefix'
    usage && exit 1
fi

# Env variables:
if [[ -z "$TONIC_DATABASE_URL" ]]; then
    echo 'ERROR: Missing ENV TONIC_DATABASE_URL'
    usage && exit 1
fi
if [[ -z "$AWS_ACCESS_KEY_ID" ]]; then
    echo 'ERROR: Missing ENV AWS_ACCESS_KEY_ID'
    usage && exit 1
fi
if [[ -z "$AWS_SECRET_ACCESS_KEY" ]]; then
    echo 'ERROR: Missing ENV AWS_SECRET_ACCESS_KEY'
    usage && exit 1
fi

# Perform a pg_dump of the tonic database
temp_dir=$(mktemp -d)

# --schema=public matches the output format of export_seeds used by station
# --no-owner works around Tonic attributing itself as owner of all the tables
pg_dump "$TONIC_DATABASE_URL" \
    --schema=public \
    --no-owner \
    --data-only \
    --file="$temp_dir/dump.sql" \
    || (echo 'ERROR: Failed to perform pg_dump' && exit 1)

# Gzip the pg_dump
gzip "$temp_dir/dump.sql"

# Upload the SQL dump to S3
date_val=$(date +"%Y-%m-%d") # e.g. 2022-10-13

aws s3api put-object \
 --bucket "${upload_bucket}" \
 --key "${upload_bucket_key}/${upload_bucket_prefix}_${date_val}.sql.gz" \
 --body "$temp_dir/dump.sql.gz" \
 || (echo 'ERROR: Failed to write to S3' && rm "$temp_dir/dump.sql.gz" && exit 1)

# Cleanup local file
rm "$temp_dir/dump.sql.gz"
