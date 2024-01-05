# EDD: Merge Queue

**Author:** [Jordan Rule](jordan.rule@*company-data-covered*.com)

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all of the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [x] Make sure PRD and EDD are aligned - EM
- [x] EDD has been reviewed by internal team members - EM

## Resources

<!-- prettier-ignore -->
[PRD](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EWDt12L_ZzNGuoO9rIs-1VYBXq1ltTZaLRVUOhwReDibFw?e=fckdp8)

<!-- prettier-ignore -->
[Market Availability and Visit Feasibility EDD](https://github.com/*company-data-covered*/services/blob/trunk/docs/edd/logistics-service/market-availability-and-visit-feasibility.md)

- This document describes the "Processed in a merge queue" portion of the system

## Glossary

CR - care request

## Overview

This EDD describes several approaches to enabling sequential execution of feasibility checks.

## Goals

In order to check feasibility during acceptance of a CR, we will need to implement a merge queue to ensure that two subsequent runs of feasibility do not return conflicting answers. Specifically, we need to make sure we sequentially run existing schedule + CR1, then either (1) existing schedule + CR1 + CR2 on feasibility and (2) existing schedule + CR2 on infeasibility. To handle this we need to determine how to enforce a lock between independent calls to `accept_if_feasible`.

Requirements:

- Enable sequential execution of check feasibility by market
- Fail gracefully in the event of deadlock and/or reset connection

## Design Proposals

### Proposal 1 – Utilize Advisory Locks in Postgres - Recommended

Every time the `accept_if_feasible` service is called, [retrieve an advisory lock](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS) by market from logistics-db, and release the lock on completion or after a timeout. The timeout will cause a retry server side, and return an error to the client only after a set number of retries.

In the event that the service backs up with multiple requests, we may have multiple threads polling with an open session to postgres. In this case, we would expect the execution time of the service to be longer than five seconds and may have to relax existing expectations.

Additionally, our default connection pool is designed for high speed transactions. We would need to maintain an independent connection pool, configurable in statsig, specifically for the advisory lock to relax this requirement.

```
func handleFeasibilityGrpc(careRequest, serviceRegion, serviceDate) {
  var lockValue = computeLockValue(serviceRegion, serviceDate)
  db.writeLock(lockValue)
  ...
  doFeasCheck... // pulls latest feasible CRs, assuming all prior CRs in DB
  ...
  db.releaseLock(lockValue)
}
```

[Proof of Concept](https://gist.github.com/jordanrule/39fc85a75d38fa49688092453e3d37cc)

Pros:

- Does not require additional infrastructure
- Easy to implement

Cons:

- A single dropped session to postgres will release lock, not guaranteeing sequential execution if check feasibility continues to execute, if all sessions are dropped sequential execution will still occur after retry

### Proposal 2 – Utilize a Kafka Work and Completed Queue

Every time the `accept_if_feasible` service is called, enqueue the entry to kafka by market with an event ID and then poll for that event ID in a completed queue that contains the response. An independent, single-threaded queue reader per market can read from the kafka queue and execute feasibility checks in order and enqueue them to the completed queue.

Pros:

- Less concern with distributed deadlocks
- Straightforward to distribute load amongst multiple workers

Cons:

- Additional dependency to manage

### Proposal 3 – Build a Coordinator Service

Build a coordinator service with an independent application name such that the number of containers can be controlled and set to 1. All `accept_if_feasible` service calls would hit this endpoint, which would store a lock in global memory, and on completion of a call into the feasibility endpoint, would release the lock for the next feasibility call or after a timeout.

```
func handleFeasibilityGrpc(careRequest, serviceRegion, serviceDate) {
  var lockValue = computeLockValue(serviceRegion, serviceDate)
  global.writeLock(lockValue)
  ...
  doFeasCheck... // pulls latest feasible CRs, assuming all prior CRs in DB
  ...
  global.releaseLock(lockValue)
}
```

Pros:

- Does not require managing third-party infrastructure

Cons:

- May lock by market for duration of timeout if failure occurs during check feasibility
- Complexity surrounding adding an additional service and managing it independently of logistics-service
- Additional infrastructure to manage

### Proposal 4 – Utilize a Global Lock in Logistics Service

All `accept_if_feasible` service calls would store a lock in global memory in logistics service, and on completion of a call into the feasibility endpoint, would release the lock for the next feasibility call or after a timeout.

```
func handleFeasibilityGrpc(careRequest, serviceRegion, serviceDate) {
  var lockValue = computeLockValue(serviceRegion, serviceDate)
  global.writeLock(lockValue)
  ...
  doFeasCheck... // pulls latest feasible CRs, assuming all prior CRs in DB
  ...
  global.releaseLock(lockValue)
}
```

Pros:

- Does not require managing third-party infrastructure
- Requires no outside dependencies

Cons:

- May lock by market for duration of timeout if failure occurs during check feasibility
- Cannot scale logistics-service beyond a single container

### Proposal 5 – Utilize a Postgres Work and Completed Queue

Every time the `accept_if_feasible` service is called, write the entry to a postgres table that represents a queue by market with an event ID and then poll for that event ID in a postgres table that represents a completed queue and contains the response. An independent, single-threaded queue reader per market can read from the postgres table and execute feasibility checks in order and write them to the postgres completed queue.

Pros:

- Less concern with distributed deadlocks
- Straightforward to distribute load amongst multiple workers
- Allows auditing the sequence of merge queue requests

Cons:

- Polling Postgres completed queue presents a constant drain on server connections and resources
- Requires significant additional design work surrounding queue representation

## Platform Components

This affects the onboarding (AOB), web request (OSS), and CareManager portions of the application. All existing calls to the station `update_status` service with `status: accepted` will need to utilize the new `accept_if_feasible` service, handle new GRPC wait times and failure cases, and existing calls to `check_feasibility` can be removed.

## Data Design & Schema Changes

There will be no data design or schema changes.

## Metrics & Data Integration

We already store check feasibility runs in logistics-db, so there is little to no value in data integration above failure alerting.

## Error Handling & Alerting

We will need to build instrumentation around our use of third party infrastructure:

Postgres

- We will want to alert on dropped sessions as they may produce inconsistent data

Kafka

- We will want to alert on disk, memory, and queue depth as we may need to scale

## Safety

The merge queue should be enabled by feature flag per market such that any abnormal behavior in deadlocks witnessed in production can be rolled back.

## Security

Proposal three introduces a new API endpoint that will need to follow authentication best practices for new services.

## Audits and Logs

State changes will not need to be observed and stored.

## Scalability

There is very little concerns surrounding scalability given that even our most active markets we expect the calls to `accept_if_feasible` to be on the order of 5-10 per minute at peak. Care needs to be taken around memory pooling such that queue backup does not exceed the number of connections available to the queue, as each lock will need to hold a session open.

## Cost

Given expected loads there are no cost concerns.

## Experimentation

This feature does not require experimentation.

## Testing

Cypress integration suite adding load to the `accept_if_feasible` endpoint.

## Training

This change will require end user training around the failure case in a fully booked market. This will require developer training on the additional alerting and monitoring we build to detect deadlocks and dropped sessions.

## Deployment

If we decide on proposal 2, we will need to add Kafka provisioning to our rollout strategy for new markets.

## Lifecycle management

No lifecycle management concerns.
