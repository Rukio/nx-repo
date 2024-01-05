# Scripts

The scripts in this folder are deployed to the `tonic` namespace as cronjobs in order to monitor and automate Tonic Data-Generation processes.

## Example Usage:

```bash
# Run the setup script to kick off data generation
sh tonic_setup.sh \
    --tonic-workspace-id "dcc038da-5d71-6c09-d98a-8476da48b366" \
    --tonic-base-url "https://tonic.prd.*company-data-covered*.com"

# Run the cleanup script 3 hrs later to export the data
# (Provides enough time for Tonic data generation to run to completion)
sh tonic_cleanup.sh \
    --upload-bucket "*company-data-covered*-env-setup" \
    --upload-bucket-key "dashboard-tonic" \
    --upload-bucket-prefix "dashboard"
```

## Tonic Base URL

The Tonic Base URL may be:

- `https://tonic.prd.*company-data-covered*.com` - if running from outside of the cluster (requires VPN)
- `tonic-web-server.tonic.svc.cluster.local` - if running within the cluster

## Environment Variables

| Variable                | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `APTIBLE_EMAIL`         | Email used for bot to login to Aptible and perform temporary DB setup/teardown    |
| `APTIBLE_PASSWORD`      | Password used for bot to login to Aptible and perform temporary DB setup/teardown |
| `TONIC_API_KEY`         | API key used to update Tonic service and initiate data generation                 |
| `TONIC_DATABASE_URL`    | Connection string for the Tonic target database                                   |
| `AWS_ACCESS_KEY_ID`     | AWS credentials for the shared S3 seeds bucket, as defined in `--upload-bucket`   |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for the shared S3 seeds bucket, as defined in `--upload-bucket`   |
