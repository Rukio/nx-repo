# CareManager Service Runbook

Status: Live in production

Frontend application URLs:

- [QA](https://caremanager-qa.stage.*company-data-covered*.com)
- [UAT](https://caremanager-uat.stage.*company-data-covered*.com)
- [Production](https://caremanager.*company-data-covered*.com)

## Contacts

Contacts: Pablo Ortiz, Roberto Fierros, César Landeros

Slack Channel: [#prd-care-orch](https://dh-techteam.slack.com/archives/C04BKTARRT2)

- Message the channel in case of any questions. Anyone in channel should be able to help you.

## Deploys

Deploys should only come from `trunk` in Github Actions workflows:

[Deploying a service to aptible via github actions](https://*company-data-covered*.atlassian.net/wiki/spaces/EC/pages/89194584/Deploying+A+Service+To+Aptible+Via+Github+Actions)

**Note:** it is recommend to also deploy `caremanager-frontend` along the service (frontend deployment instructions can be found [here](https://github.com/*company-data-covered*/caremanager-frontend#how-to-deploy)).

## Monitoring

DataDog:

- [CareOrchestration Dashboard](https://app.datadoghq.com/dashboard/45j-3y8-ths/care-orchestration?from_ts=1680632537952&to_ts=1680636137952&live=true)
- [caremanager-service APM](https://app.datadoghq.com/apm/services/caremanager-service/operations/grpc.server/resources?env=prod)

Aptible Dashboard:

- [caremanager-service-prod](https://dashboard.aptible.com/apps/44110/services)

## Diagnostics

### Logs

Service logs can be consumed directly from Aptible or in [DataDog](https://app.datadoghq.com/logs?query=service%3Acaremanager-service%20env%3Aprod):

```sh
# CareManager/Go in prod
$ aptible logs --app caremanager-service-prod
```

### Database Access

For production, use the database replica to read data. Use the following command to establish a tunnel to the database:

```sh
# Tunnel to database
$ aptible db:tunnel caremanager-service-db-prod-replica
```

Use a PostgreSQL client to connect with the credentials outputted by the command.

## Troubleshooting

The majority of the issues the service experiences are related to outages in Station. `caremanager-service` relies heavily on Station gRPC calls (basically all requests to `caremanager-service` imply calls to Station). So if Station is slow or it's down, it is expected for `caremanager-service` to be slow and/or down.

To identify if Station is the cause of malfunction, check DataDog APM stats and look for the _% of Time Spent_ graph and identify where the bottleneck is. The following components correspond to Station:

- `active_support_cache`
- `station`
- `grpc`
- `redis`
- `pg`

## Internal Operations

These RPCs are intended to be manually called.

### Accessing production environments with RDP

Is mandatory for international contractors to use a remote machine to access production environments. You can follow the next steps to connect to a remote desktop in the US:

1. Go to https://cwa-_company-data-covered_.screenconnect.com
2. Click "Login"
3. Click "Connect with Azure Active Directory"
4. Select one of the remote desktops and click "Join"

ConnectWise will prompt you to download an application if you haven't already. If you don't have the required credentials please contact your manager.

### Obtaining an Auth token

The easiest way of obtaining an Auth token is by using a web browser to login into CareManager and using the network inspector to extract it from the `authorization` header.

### Visits

#### Assign a Visit to another Episode

RPC: `UpdateVisitEpisode`
HTTP endpoint: `/v1/visits/:id/episode`
JSON body:

```json
{
  "episode_id": "new episode ID"
}
```
