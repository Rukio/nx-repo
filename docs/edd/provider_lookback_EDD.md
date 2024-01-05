# EDD: Provider Daily Look Back

**Authors:**

- Maksym Bilchenko maksym.bilchenko@_company-data-covered_.com
- Dmytro Hruzin dmitry.hruzin@_company-data-covered_.com
- Alexander Primakov alexander.primakov@_company-data-covered_.com
- Yurii Kirgizov yurii.kirgizov@_company-data-covered_.com
- Serhii Komarov serhii.komarov@_company-data-covered_.com

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [x] Make sure PRD and EDD are aligned - EM

## Resources

PRD: [Provider Look Back PRD](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EXX3ae20oalBmhjj3FPuOS4B3yzXDoMTuwW_z9auTSTPqQ?e=PsgOaB)

Supporting designs: [Figma](https://www.figma.com/file/XB1JozOpfEmezV0XQIJdVB/Idle-Time-Reduction%3A-Daily-Performance-Lookback?node-id=1-867&t=aROKV3oicMq6m4Pt-0), [spreadsheet](https://*company-data-covered*-my.sharepoint.com/:x:/p/scott_gustin/EbaoACStfOxBh_vzIRXXbBMBCJg97YEKxeMPiKMheHV7aw?e=LOaOS4)

## Overview

This design is intended to achieve convenient and efficient way for providers to check their own performance statistics in the previous N days (not including today).

On Provider Look Back page, provider will be able to check:

- Last shift breakdown:

  - number of patients they have seen
  - average number of patients seen per shift in market group
  - breakdown based on the status changes of the care requests

- Last 7 days statistics:
  - Chart with info about how many patients were seen in specific days VS average per market group in a day

## Goals

We provide a convenient tool for providers to check their performance and determine whether they are meeting the high expectations of our company to deliver excellent and efficient care to our patients. This tool will be used both on the station and the clinical KPI dashboards, so the technology choice should allow this.

## Backend Design Proposals

### Proposal 1 – Station endpoint

- implement station endpoint which will return:
  - provider patients seen for last 7 working days and market group average patients seen for corresponding dates

#### Endpoint:

- GET api/provider/<provider_id>/look-back

#### Logic:

Fetch visits for provider for last 7 working days. Detect visit's markets.
Data will be calculated and cached on demand per request.

#### Pros:

- Less effort to implement compared to Proposal 2
- No need to modify data schema

#### Cons:

- Keep adding logic to station
- On demand calculation of stats may increase database load

### Proposal 2 – ClinicalKPIService endpoint (Recommended)

- implement ClinikalKPIService endpoint which will return:
  - provider patients seen for last 7 working days and market group average patients seen for corresponding dates

DE will reverse ETL data from Redshift into Postgres as described in [Clinical KPI EDD](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EfkpOcbCOkFIutR-F_zfBkkBK8NEEtMEVMBf4q-yLOU3jw?e=bdVikf)

For staging_provider_metrics_daily table we will need information about how many patients provider seen in a specific day.
For staging_market_group_metrics_daily table we will need information about the average number of visited patients per market group for a specific date.
And for staging_provider_day_breakdowns table we will need information about the actions performed by the provider during the last day. We need next actions: "en_route" care request statuses, "on_scene" care request statuses and "on_break"s.
Only data about Acute Care, Bridge Care and Wellness visits should be included.

#### Endpoint:

- GET /metrics/providers/<provider_id>/look-back

#### Logic:

Fetch visits for provider for last 7 working days. Detect visit's market/s.

#### Pros:

- No changes to station
- ClinicalKPIService encapsulate provider performance logic
- The query cost for metrics is cheap because the calculation is done upfront

#### Cons:

- ClinicalKPI Schema modifications required
- Need to extend current reverse ETL data from Redshift into ClinicalKPI Postgres db

#### Response:

Response for both ClinicalKPI and Station endpoints.

```
{
    "shiftsTrend": [
        {
            "date": {
                "year": 2023,
                "month": 5,
                "day": 19
            },
            "providerCompletedCr": 0,
            "averageCompletedCr": 4.061307430267334
        },
        {
            "date": {
                "year": 2023,
                "month": 5,
                "day": 20
            },
            "providerCompletedCr": 4,
            "averageCompletedCr": 4.634027004241943
        },
        {
            "date": {
                "year": 2023,
                "month": 5,
                "day": 21
            },
            "providerCompletedCr": 6,
            "averageCompletedCr": 8.069280624389648
        },
        ...
    ],
    "lastDayBreakdowns": {
        "date": {
            "year": 2023,
            "month": 5,
            "day": 24
        },
        "dayBreakdowns": [
            {
                "stage": "STAGE_EN_ROUTE",
                "startTime": "2023-05-24T08:00:00Z",
                "endTime": "2023-05-24T08:26:00Z"
            },
            {
                "stage": "STAGE_ON_SCENE",
                "startTime": "2023-05-24T08:27:00Z",
                "endTime": "2023-05-24T08:59:00Z"
            },
            {
                "stage": "STAGE_EN_ROUTE",
                "startTime": "2023-05-24T08:59:00Z",
                "endTime": "2023-05-24T09:25:00Z"
            },
            {
                "stage": "STAGE_ON_SCENE",
                "startTime": "2023-05-24T09:28:00Z",
                "endTime": "2023-05-24T09:55:00Z"
            },
            {
                "stage": "STAGE_ON_BREAK",
                "startTime": "2023-05-24T09:55:00Z",
                "endTime": "2023-05-24T10:25:00Z"
            },
            {
                "stage": "STAGE_EN_ROUTE",
                "startTime": "2023-05-24T10:25:00Z",
                "endTime": "2023-05-24T10:52:00Z"
            },
            ...
        ]
    }
}
```

Data from these endpoints will be used to represent statistic and charts of the [FE](https://www.figma.com/file/XB1JozOpfEmezV0XQIJdVB/Idle-Time-Reduction%3A-Daily-Performance-Lookback?node-id=1-867&t=aROKV3oicMq6m4Pt-0).

## Frontend Design Proposals:

Because the shift performance view should be shown both on the performance hub (clinical KPI) and station, there are a few ways to achieve this.

### Proposal 1 - IFrame

Implement Shift Performance page on the performance hub side. Once implemented, integrate it to the station using iFrame.

#### Pros:

- Native HTML tag. Well-known technology.

#### Cons:

- Communication with an iFrame is complicated and slow.
- IFrames are blocked by Ad blockers.

### Proposal 2 - Widget

Implement Shift Performance widget using [EDD – Widgets](https://*company-data-covered*.sharepoint.com/:w:/r/sites/tech-team/_layouts/15/Doc.aspx?sourcedoc=%7B3B5099B8-E4E3-4E0E-A3E2-5914F46A166F%7D&file=EDD%20-%20Widgets%20inside%20the%20Monorepo.docx&action=default&mobileredirect=true) inside the monorepo and then use it both on performance hub and station side.

#### Pros:

- Using existing tested approach.
- Even though we have only 1 widget now, it’s live on production and works well.

#### Cons:

- Additional triggering of the same endpoints on Station and Widget sides
- We don’t really need a data-connected Widget

### Proposal 3 - Design-System

Add Shift Performance page to design-system and provide all data for it from Station

#### Pros:

- Straightforward approach. No need to look for other technologies
- Easy to implement and reuse

#### Cons:

- Shift Performance page doesn't really suit design-system

### Proposal 4 - Separate library in the Services repository (Recommended)

Implement Shift Performance page to the new separate library in the Services repository that could be shared.
Similar to the previous approach, but without burdening the design system.

#### Pros:

- Straightforward approach. No need to look for other technologies
- Easy to implement and reuse

#### Cons:

- Need to publish another package that station can consume

## Platform Components

### Proposal 1:

- Need to update station FE.
- Need to implement 2 new Station endpoints.

### Proposal 2:

- Need to update station FE.
- Need to add 2 new endpoints to ClinicalKPIService.
- Need to update ClinicalKPIService DB

## Data Design & Schema Changes

### Proposal 1:

- No schema changes are needed.

### Proposal 2:

The ClinicalKPIService endpoint will require the following tables to be added to the Redshift reverse ETL.
Data Engineering will be performing a reverse-ETL process to push data from Redshift as it's already set up for the ClinicalKPI service.
The following tables will be updated each morning for the previous days data:

- staging_provider_metrics_daily table will contain information about how many patients provider seen in a specific day and market group.
- staging_market_group_metrics_daily table will contain information about the average number of visited patients per market group for a certain date.
- staging_provider_day_breakdowns table will contain information about the actions performed by the provider during the last day. Currently, there are three actions: "en_route", "on_scene" and "on_break"
  Only data about Acute Care, Bridge Care and Wellness visits should be included.

Add staging_provider_metrics_daily table with next columns:

- provider_id
- market_group_id
- date
- patients_seen
- created_at
- updated_at

Add staging_market_group_metrics_daily table with next columns:

- market_group_id
- date
- average_patients_seen
- created_at
- updated_at

Add staging_provider_day_breakdowns table with next columns:

- provider_id
- date
- stage - ("en_route", "on_scene", "on_break")
- start_time
- end_time
- created_at
- updated_at

## Metrics & Data Integration

No additional specific metrics are required.

## Error Handling & Alerting

DataDog logs and slack alerts

## Safety

There are no any unusual safety concerns around this design.

## Security

- two new endpoints
- no new dependencies on external systems
- new third party Chart Library

## Audits and Logs

As mentioned in Error Handling & Alerting, Data Dog will be added for logging.

## Scalability

No scalability issues should appear.

## Cost

Don't require additional cost

## Testing

Will require FE auto tests, standard services endpoint test, DB tests.

## Training

Should present our product result to Providers.

## Deployment

Not any unusual notes about the deployment.

## Lifecycle management

Not any technology choices in danger of being sunset, abandoned, or deprecated.
