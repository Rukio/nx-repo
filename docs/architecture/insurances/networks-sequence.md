# Insurance Service

```mermaid
sequenceDiagram
    %% Nodes
    participant Insurance Dashboard
    participant Insurance gRPC as Insurance Service + gRPC Gateway
    participant Insurance DB
    participant Station API
    participant InsurancePlanGRPC as Station Insurance Plan gRPC
    participant Modality gRPC

    %% Flows

    note right of Insurance Dashboard: Create Insurance Network
    Insurance Dashboard ->> Insurance gRPC: Send create insurance network request
    Insurance gRPC ->> InsurancePlanGRPC: Send request to create new insurance plan
    InsurancePlanGRPC ->> Insurance gRPC: Send newly created insurance plan
    Insurance gRPC ->> Insurance DB: Save insurance network data in DB

    note right of Insurance Dashboard: Update Insurance Network
    Insurance Dashboard ->> Insurance gRPC: Send update insurance network request
    Insurance gRPC ->> InsurancePlanGRPC: Send request to update existing insurance plan
    InsurancePlanGRPC ->> Insurance gRPC: Send updated insurance plan
    Insurance gRPC ->> Insurance DB: Update insurance network data in DB

    note right of Insurance Dashboard: Get Insurance Network Modality Configurations
    Insurance Dashboard ->> Insurance gRPC: Send request to get insurance network details
    Insurance Dashboard ->> Insurance gRPC: Sends request to receive list of service lines
    Insurance gRPC ->> Station API: Proxy request to receive list of service lines
    Insurance Dashboard ->> Insurance gRPC: Send request to get list of states
    Insurance gRPC ->> Station API: Proxy request to receive list of states
    Insurance Dashboard ->> Insurance gRPC: Send request to get list of modalities
    Insurance gRPC ->> Station API: Proxy request to get list of modalities
    Station API ->> Modality gRPC: Proxy request to get list of modalities
    Insurance Dashboard ->> Insurance gRPC: Send request to get list of insurance network service lines
    Insurance gRPC ->> Station API: Proxy request to get list of insurance network service lines
    Station API ->> Modality gRPC: Proxy request to get insurance network service lines
    Insurance Dashboard ->> Insurance gRPC: Send request to get list of insurance network modality configurations
    Insurance gRPC ->> Station API: Proxy request to get list of insurance network modality configurations
    Station API ->> Modality gRPC: Proxy request to get insurance network modality configurations

    note right of Insurance Dashboard: Update Insurance Network Modality Configurations
    Insurance Dashboard ->> Insurance gRPC: Send request to update insurance network modality configurations
    Insurance gRPC ->> Station API: Proxy request to update modality configurations
    Station API ->> Modality gRPC: Proxy request to update modality configurations
```

## Insurance Network

Insurance Network is a replacement of current Station Insurance Plan. The main difference from Insurance Network vs Insurance Plan is that Insurance Network is no longer tied to State, so we can operate with the same Insurance Network in multiple markets.

Insurance Network has corresponding Insurance Plan created in Station, so from Station and AOB perspective we still can operate with Insurance Plan model, which has less development impact on the project.

Insurance network replicates all configurations available on Station now, but which moved to the Insurance Dashboard UI.

## Modality Configurations

Network modality configurations regulates business modality rules for given Insurance Network based on billing city and service line.
