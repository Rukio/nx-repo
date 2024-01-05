# Notifications Service Runbook

Status: Release ready

## Contacts

Contacts:

- Dmitry Hruzin <mailto:dmitry.hruzin@*company-data-covered*.com>
- Serhii Komarov <mailto:serhii.komarov@*company-data-covered*.com>

Slack Channel: [#prd-provider](https://dh-techteam.slack.com/archives/C04AW5JCMBM)

Pagerduty Oncall Link: [Provider Enablement](https://*company-data-covered*.pagerduty.com/teams/PQQQ9DB)

# Notifications Service/Go in prod

## Diagnostics

### Logs

Service logs can be consumed directly from Aptible or
in [DataDog](https://app.datadoghq.com/logs?query=service%3Anotifications-service%20env%3Aprod):

```sh
aptible logs --app notifications-service-prod
```

Use healthcheck endpoints

```sh
curl elb-dispatch-71029.aptible.in/healthcheck
```

Response example: `{ "status": "SERVING" }`

## Deploys

Deploys should only come from `trunk` in GitHub Actions workflows:

[Deploying a service to aptible via github actions](https://*company-data-covered*.atlassian.net/wiki/spaces/EC/pages/89194584/Deploying+A+Service+To+Aptible+Via+Github+Actions)

## Configuration

### Aptible

Change cron schedule interval:

```sh
aptible config:set --app notifications-service-<env> SCHEDULE_CHANGED_CRON_EXPRESSION="{new_cron_expression}"
```

Example:

To set cron job interval on Notifications Service QA environment to 5 minutes you need to execute command:

```sh
aptible config:set --app notifications-service-qa SCHEDULE_CHANGED_CRON_EXPRESSION="*/5 * * * *"
```

### Statsig gates

- Switch for provider notification cron job

  [provider_notifications_shift_schedule](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/provider_notifications_shift_schedule)

- Should enable/disable all functionality inside provider notification cron job.

### Statsig dynamic configs

Provider notification cron job configs:

- Should control how cron job is running for markets
  [provider_notifications_shift_schedule_settings](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/provider_notifications_shift_schedule_settings)

  - See [`settings.go:settings`](../../go/cmd/notifications-service/provider-notifications-service/settings.go) for
    JSON setting reference

## Monitoring

Aptible Dashboard:

- [notifications-service-prod](https://dashboard.aptible.com/apps/55530/services)
