# Mini EDD: Sync ClinicalKPI features

**Authors:**

- Dmitry Hruzin dmitry.hruzin@*company-data-covered*.com
- Mykhailo Hladkyi mykhailo.hladkyi@*company-data-covered*.com

# Glossary

## Resources

- [Leads View EDD](https://github.com/*company-data-covered*/services/blob/trunk/docs/edd/leads_view_individual_visibility_tool.md)
- [Provider Daily Look Back EDD](https://github.com/*company-data-covered*/services/blob/trunk/docs/edd/provider_lookback_EDD.md)

## Overview

The purpose of this document is to consolidate data and functionalities of Clinical KPI service across its
features.

There are several points for improvement of consistency in ClinicalKPI service is described. Let's discuss each of
them and decide what points should and should not be implemented.

ClinicalKPI features:

- Provider Performance Hub
- Provider Daily Look Back
- Leads View

## Goals

- Make code of ClinicalKPI Service more consistent
- Merge similar DB tables
- Decrease complex FE logic

## Design

### Step 1: Daily Look Back and Leads View features sync

- Point 1: Remove foreign keys for Look Back tables
  `markets.market_group_id --> market_groups.market_group_id`

Not sure if it is a good practice, but Probably we can remove foreign keys in table to make DE migrations easier.
Since data consistency is already validated on DE side.

- Point 2: Merge tables for Leads View and Look Back

There are shift_snapshots and provider_shift_snapshots tables

- Shift_snapshots are used to store snapshots for shift breakdown
- Provider_shift_snapshots are used to store snapshots for provider's day breakdown

We probably can merge these tables and use provider_shifts table to find all shifts for provider for service_date.
Then take snapshots for these shifts.

- Point 3: Remove `/leads` prefix

The leads prefix was added because of policies reasons. So we wanted to grant access to `/leads` endpoints based on market role. But with OPA it is ok just to register list of endpoints. So no need the prefix anymore.

- Point 4: Convert snapshots timestamps types to google.protobuf.Timestamp

In Daily Look Back we have a date type in this format - { year: number; month: number; day: number; } while for leader hub we have a date in this format - { year: number; month: number; day: number; hours: number; minutes: number; seconds: number; nanos: number; }.

### Step 2: Performance Hub update

This is an optional step. Performance Hub is live already for half a year and it works.
But after DE team has updated the Reverse ETL experience. And with ClinicalKPI service update we can consider to:

- Point 1: Use Leads View tables

If DE team will provide `week_change` metrics for provider_metrics as they do for market_metrics we can use
provider_metrics table instead of calculated_provider_metrics.

- Point 2: Remove staging job

In case we are good to go with `Point 1` then we potentially do not need the staging job and staging_provider_metrics
and historical_provider_metrics tables. So can remove them.

- Point 3: Remove requests to Station that were added for authorization

Since we have turned ON the ClinicalKPI authorization step we do not need to call Station for checking access anymore.
So can remove these calls.

- Point 4: Add OPA policy for metrics request

Deny to retrieve metrics data for user with different ID than they have in Access Token.

- Point 5: Implement data anonymizing on backend side

For Performance Hub feature we should hide all names and avatars except current provider's and providers' of first 3 ranks.
Currently, this logic is implemented on frontend side. These data is still visible in network tab. So it is better to move it to backend.

## Metrics & Data Integration

No changes.

## Error Handling & Alerting

No changes.

## Safety

No changes.

## Security

No changes.

## Audits and Logs

No changes.

## Scalability

N/A

## Cost

No extra costs

## Experimentation

No changes.

## Testing

- Manual regression testing
- Existing unit tests

## Training

Nothing new will be added for end user

## Deployment

No changes.

## Lifecycle management

No changes.
