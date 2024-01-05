# Provider Notifications Service

> This document represents the provider notification service flow and how it's connected to Twilio service.
> Connection between Twilio service and Twilio API is in separate file [twilio-service-sequence.md](./twilio-service-sequence.md).

```mermaid
sequenceDiagram

    %% Nodes
    participant Provider Notifications Service as Provider Notifications Service<br>(Notifications Service)
    participant Station as Station
    participant Logistics as Logistics
    participant Twilio Service as Twilio<br>(Notifications Service)

    %% Flows
    autonumber 1
    rect rgb(127, 17, 224, 0.1)
        note right of Provider Notifications Service: Provider notification cron job workflow
            loop At cron job interval
                Provider Notifications Service ->> Station: GET: list of available markets
                Station ->> Provider Notifications Service: list of available markets
                par
                    Provider Notifications Service ->> Logistics: GET: schedules for markets
                    Logistics  ->> Provider Notifications Service: schedules for markets
                    Provider Notifications Service ->> Provider Notifications Service: Identify shifts to notify
                    Provider Notifications Service ->> Provider Notifications Service: Save previous state for previous shifts schedules
                    Provider Notifications Service ->> Station: GET: shift teams by ids
                    Station ->> Provider Notifications Service: list of shift teams
                    opt Provider didn’t commit to CR within
                      Provider Notifications Service ->> Twilio Service: Send SMS
                    end
                end
            end
    end
```
