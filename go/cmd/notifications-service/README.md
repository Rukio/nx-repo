# Notifications Service

This server consists of 3 services and provides:

- API for sending SMS by Twilio service
- API for posting Slack messages
- running cron jobs for provider notifications

### Resources

- [Runbook](../../../docs/runbook/notifications-service.md): Information for handling production system-downs for issues involving the Notifications Service.

### Running Notifications Service Server locally

```sh
# Build and run the service
make build-go-notifications-service && \
    env $(xargs < .env.development.local) generated/bin/go/cmd/notifications-service/notifications-service
```
