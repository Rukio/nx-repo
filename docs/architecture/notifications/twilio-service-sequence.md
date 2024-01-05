# Twilio Notification Sequence

```mermaid
sequenceDiagram

    %% Nodes
    participant Twilio Service as Twilio<br>(Notifications Service)
    participant Twilio API as Twilio API

    %% Flows
    autonumber 1
    rect rgb(127, 17, 224, 0.1)
        note right of Twilio Service: SendSMS
        Twilio Service ->> Twilio API: Send phoneNumber and message
    end
```
