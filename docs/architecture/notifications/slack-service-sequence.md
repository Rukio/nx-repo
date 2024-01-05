# Slack Notification Sequence

```mermaid
sequenceDiagram

    %% Nodes
    participant Slack Service as Slack Service<br>(Notifications Service)
    participant Slack API as Slack API

    %% Flows
    autonumber 1
    rect rgb(127, 17, 224, 0.1)
        note right of  Slack Service: PostMessage
        Slack Service ->> Slack API: Find user by e-mail
        Slack API ->> Slack Service: user id
        Slack Service ->> Slack API: Send user id and message
    end
```
