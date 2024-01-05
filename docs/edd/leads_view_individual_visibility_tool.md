# EDD: Leader Hub feature implementation

**Authors:**

- Vladimir Fedorchenko vladimir.fedorchenko@_company-data-covered_.com
- Dmitry Hruzin dmitry.hruzin@_company-data-covered_.com

# Glossary

- ABX: Antibiotic-Prescribing
- Area Manager: Responsible for a subset of the markets within the region and reports directly to the RDO. Is responsible for assigned - direct report performance and overall assigned market efficiency and performance.
- Lead APP: Local leadership for the APPs
- Lead DHMT: Local leadership for DHMTS when the market is of size
- Market Manager: Responsible for the health of the market
- RDO (Regional Director of Operations): Responsible for the productivity and efficiency of all of their markets.
- RMD (Regional Medical Director): Responsible for the clinical outcomes of the region while managing APP performance
- Market group - Some providers have shift teams in different markets in the same day. So to calculate their metrics was decided to use market_groups instead of markets.
  A market group is Redshift definition for group of markets the provider is active in. In majority cases there is just one market in the group.
  E.g. a provider have one shift in DEN and another in COS in the same day. So market group will contain two markets: DEN and COS.

## Metrics calculation periods

On Scene Time - median for the last 80 Visits
Chart Closure Rate - rate for the last 80 Visits
Survey Capture Rate - rate for the last 80 Visits
Avg NPS - average for the last 80 Visits
Escalation Rate - rate for the last 80 Visits
ABX Rate - rate for the last 80 Visits
On Task % - on task rate of all time "on shift" time over the last 30 days

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [x] Make sure PRD and EDD are aligned - EM

## Resources

- [PRD](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EW3z3ObmYVFPiu1q2GCrPjkBHnfIg0A5MQYy5iI8cKCtiw?e=X0SOKk)
- [Multi-service Frontend Auth](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EX4o6ep5FXdEnrCsM_bM5OkBDU-5-Zo4R0uE7iJsvhy1Pg?e=Tmiy5Y)
- [Figma design](https://www.figma.com/file/lLQMcnQd07m3aLFT3w4Bl6/Leads-View---Individual-Shift-Visibility?type=design&node-id=1-867&t=xSTYLtZtIz1CK11v-0)

## Overview

The Leads View EDD is intended to define engineering concerns about the new Leads view implementation.
Leads view is a statistic page for supervisors to check performance of each provider and market.

## Goals

- Increase of market managers and leads having the information needed to investigate WHY metrics are the way they are
- Explore and discuss different options of how to compute and store data for Leads View feature.

## Design (Front-End)

Leads View is a feature extending existing performance hub functionality on clinical KPI.

Leads view consists of two main parts:

- Leader Hub
- Performance Hub of Individual

All users that will be able to navigate to the performance hub from the Dashboard.
Personal view remains the same, but for Lead APP/DHMT there should be a header to switch between user's performance hub and lead hub.
RDO/RMD, Area and Market managers should open Leads view instead of personal performance.

### My Performance Hub changes

Add "Leader's view" button to header. Clicking this button should navigate user to the Leader's View page.

### Leader Hub

On Leader Hub, user will be able to check:

- Overall market performance split into 4 categories:
  1. On Scene Time (80 day rolling avg)
  2. Survey Capture Rate
  3. Chart Closure Rate (24 hours)
  4. Patient NPS
- RDO/RMD, Area or Market Manager, Lead APP/DHMT should be able to switch market if they oversee more than one market
- Care team rankings with three filters:
  1. On Scene Time
  2. Survey Capture Rate
  3. Patient NPS

#### Care team rankings

- Should have search by name
- Should have filter by position
- Should display:
  1. Number in table
  2. Care Team Member
  3. Position
  4. On Scene Time / Survey Capture Rate / Patient NPS - Depends on selected tab in ratings
  5. Change of metric
     Manager should be able to click on row in rankings to open Performance Hub of Individual Care Team Member

### Performance Hub of Individual

Performance Hub of Individual should contain:

- Header with individual's information:
  - On Scene time average (for every CR)
  - Chart Closure rate (%) // Survey Capture Rate (%) (Every CR):
    - If individual is an APP, Chart Closure rate (%) (Every CR)
    - If individual is a DHMT, Survey Capture Rate (%) (Every CR)
  - Patient NPS (Every CR)
  - On Task % (Every Shift)
  - Escalation Rate (%) (Every CR)
  - ABX prescribing rate (%) (Every CR)
- Latest visits table
- Performance per Market
- Market specific Breakdowns

Markets that can be viewed by Lead:
This should be the list of users that have common markets with the Lead

- We will take markets for the lead from lead's access token
- We will get providers for each of the lead's markets from markets_active_providers table in Clinical KPI DB

#### Latest visits

Latest visits should have:

- Search
  - Athena ID
  - Patient
- Filter by:
  1. ABX
  2. Escalated
- Latest Visits table:
  1. Patient - Patient name with athena ID
  2. Date
  3. Chief Complaint
  4. Diagnosis
  5. ABX - Were antibiotics prescribed? Yes/No
  6. Escalated - Yes/No
- Pagination

#### Performance per Market

Performance per Market should have market selector that is displaying all markets that the user's accounts page gives them access to.
Default to the first market in the alphabetical dropdown market list.
Below the selector there should be 4 metrics:

- On Scene Time
- Chart Closure Rate
- On Task %
- Patient NPS

#### Market specific breakdowns

Below metrics there should be table of shift breakdowns:

- Shift - date in mm/dd/yyyy format as a title, start time - end time as a subtitle
- OTD
- En Route time
- On scene time
- On Break time
- Idle Time
- Visits count
- See details button which should open Shift Breakdown Modal
  Maximum 10 shifts per page. Denote if break was skipped in Dashboard.

#### Shift Breakdown Modal:

- Header should display the day and month of the selected team breakdown.
- Should have a schedule starting from start time to end time with an En Route / On Scene / Break duration on it
- Breakdown can display map if we have location information. - NOT A PART OF MVP

If location information exists, map should have:

- Team route on it
- Points on places where state of team has changed
- Slider to see location for specific time period

#### Goals and dimensions

Goals and dimensions will be hardcoded on the front end side

### Questions

- Should we change something besides adding of "Leader's View" button on My Performance Hub page?
  - No
- What markets should be in dropdown on individual's page?
  - All markets for individual. Even markets current user does not have in they list.
- Do we need escalation metrics for markets?
  - No
- How many last visits should we show?
  - All metrics are calculated from
- Do we want to show statistic changes for 7 days for metrics on individuals page?
  - No
- Do we show global ranks or by market?
  - By market

## Design (Back-End)

- Going to take user's role and active markets for current user from Access token (markets claim).
- Going to take position and active markets for providers from Clinical KPI DB
  (markets_active_providers table and providers -> job_title field).
- Just leads will have access to Leader hub Clinical KPI Service endpoints.
  - going to call OPA service to understand if user with the market role has access to leads view
- Markets info (name, short name) and provider's info (first name, last name, avatar url, job_title: app/dhmt) will be stored in Clinical KPI DB.
  So we do not need to call Station extra time and have Redshift as source of truth.

Data sources:

- Access token provides market role and list of markets for current user (lead)
- Clinical KPI DB provides
  - provider's markets list and provider's info
  - market metrics
  - provider metrics
- Redshift daily updates data in leader hub tables of Clinical KPI DB

Clinical KPI Service permissions (OPA policies):

- User with market role in [RDO, RMD, Area Manager, Market Manager, Lead APP, Lead DHMT] can call Leader hub Clinical KPI Service endpoints
- User with the MARKET in his market's list in access token can fetch:
  - metrics for the MARKET
  - metrics for providers in the MARKET
  - metrics for provider's latest visits in the MARKET
  - metrics for provider's latest shifts in the MARKET
  - metrics for provider's latest shift's breakdowns in the MARKET

Leader hub Clinical KPI Service endpoints:

- get market metrics
  - endpoint: "/v1/leader-hub-metrics/markets/{market_id}"
  - input
    - market_id
  - output
    - market metrics
- get providers market metrics
  - endpoint: "/v1/leader-hub-metrics/markets/{market_id}/providers"
  - input
    - market_id
    - metric_type
    - search
    - filter
    - pagination
  - output
    - provider metrics array
- get provider metrics
  - endpoint: "/v1/leader-hub-metrics/providers/{provider_id}"
  - input
    - provider_id
  - output
    - provider metrics
- get provider latest visits
  - endpoint: "/v1/leader-hub-metrics/providers/{provider_id}/provider-visits"
  - input
    - provider_id
    - search
    - filter
    - pagination
  - output
    - provider visits array
- get provider latest shifts
  - endpoint: "/v1/leader-hub-metrics/providers/{provider_id}/provider-shifts"
  - input
    - provider_id
    - filter (last x days)
    - pagination
  - output
    - provider shifts array
- get provider latest shift breakdowns
  - endpoint: "/v1/leader-hub-metrics/provider-shifts/{provider_shift_id}/provider-shift-breakdowns"
  - input
    - provider_latest_shift_id
  - output
    - provider shift breakdowns array

## Design (Data Migration)

### Calculated data

Calculated data - metrics that is calculated for provide/market.
Static data - information from Station/Redshift. E.g. provider's name, market short name, etc.

#### Option 1 (Recommended). Calculate average metrics for specified range (e.g. 80 visits) in Redshift

- Redshift provides average metrics for specified range. Upsert data to the ClinicalKPI DB every day
- ClinicalKPI back-end provides endpoints for fetching calculated by Redshift metrics

The next data will be updated daily in DB by Redshift. It will be updated using upsert operation with update.

Unique constraints for tables:

- market_metrics -> market_id
- market_provider_metrics -> market_id, provider_id
- provider_metrics -> provider_id
- provider_visits -> care_request_id, provider_id
- provider_shifts -> shift_team_id
- provider_shift_breakdowns -> provider_shift_id, start_time
- providers -> provider_id
- markets -> market_id
- market_groups -> market_group_id
- markets_active_providers -> market_id, provider_id

Calculations:

- Market metrics (for last 80 visits, 7 days change)
  - on scene average time
  - on scene average time week change
  - average chart closure rate
  - average chart closure rate week change
  - average survey capture rate
  - average survey capture rate week change
  - average net promoter score
  - average net promoter score week change
- Provider global metrics (for last 80 visits)
  - on scene time
  - chart closure rate
  - survey capture rate
  - net promoter score
- Provider by market metrics (for last 80 visits, 7 days change)
  - on scene average time
  - on scene average time week change
  - average chart closure rate
  - average chart closure rate week change
  - average survey capture rate
  - average survey capture rate week change
  - average net promoter score
  - average net promoter score week change
  - average on scene %
  - average on scene % week change

ClinicalKPI back-end calculations:

- Provider by market metrics
  - provider's rank by on scene average time metric
  - provider's rank by chart closure rate metric
  - provider's rank by survey capture rate metric
  - provider's rank by net promoter score metric
  - provider's rank by average on scene % metric

Pros:

- No calculations on Clinical KPI side. So Clinical KPI is just presenter of statistic data as it should be.
- Better performance in comparison with Option 2.
- Maintaining data consistency between looker and performance hub data.

Cons:

- Less flexibility. If we need to change amount of days/visits we want statistics for - we need to update it on Redshift side.

#### Option 2. Calculate daily metrics by Redshift then calculate metrics for dynamic range by ClinicalKPI

- Redshift provides average metrics for day. Insert data to the ClinicalKPI DB every day
- ClinicalKPI back-end calculates average metrics for specified range (e.g. 7/30/80 days) for every request from front-end

Redshift calculations:

- Market metrics (daily based)
  - on scene average time
  - average chart closure rate
  - average survey capture rate
  - average net promoter score
- Provider global metrics (daily based)
  - on scene time
  - chart closure rate
  - survey capture rate
  - net promoter score
- Provider by market metrics (daily based)
  - on scene average time
  - average chart closure rate
  - average survey capture rate
  - average net promoter score
  - average on scene %

ClinicalKPI back-end calculations:

- Market metrics (for 7/30/80 days, X days change)
  - on scene average time
  - on scene average time week change
  - average chart closure rate
  - average chart closure rate week change
  - average survey capture rate
  - average survey capture rate week change
  - average net promoter score
  - average net promoter score week change
- Provider global metrics (for 7/30/80 days)
  - on scene time
  - chart closure rate
  - survey capture rate
  - net promoter score
- Provider by market metrics (for 7/30/80 days, X days change)
  - on scene average time
  - on scene average time week change
  - provider's rank by on scene average time metric
  - average chart closure rate
  - average chart closure rate week change
  - provider's rank by chart closure rate metric
  - average survey capture rate
  - average survey capture rate week change
  - provider's rank by survey capture rate metric
  - average net promoter score
  - average net promoter score week change
  - provider's rank by net promoter score metric
  - average on scene %
  - average on scene % week change
  - provider's rank by average on scene % metric

Pros:

- Better flexibility. Ability to calculate metrics for different time ranges (We possibly need this functionality in 3-4 quarters).
- Fewer dependencies on Redshift.

Cons:

- No ability to calculate statistic for the last X visits (just days).
- Need to run complex aggregation queries to ClinicalKPI DB every time back-end is called.
- Possible performance issues for lists of metrics (tested, should not be).
- More dev effort in comparison with Option 1.

### Static data

#### Option 1 (Recommended). Redshift stores and daily updates static data in ClinicalKPI table

Data to store:

- Latest shift breakdowns for provider (for 80 visits)
- Latest provider's visits (for 80 visits)
- Provider information
  - first name
  - last name
  - avatar url
  - position
  - markets array
- Market information
  - name
  - short name
- Market group information
  - name
  - short name

Pros:

- No need to call station at all. So no dependency on station.
- Have a single as source of truth - Redshift.
- Can make one aggregation get request to DB for metrics and static data.
- Data is consistent. E.g. if provider changed their market it will not be inconsistency between yesterday's metrics with today's market.

Cons:

- Need to add more tables to ClinicalKPI DB.
- Need to add more Redshift migrations.

#### Option 2. Redshift provides just shift breakdowns

Data to store:

- Latest shift breakdowns for provider (for 80 visits)
- Latest provider's visits (for 80 visits)

Pros:

- Fewer data to store and migrate from Redshift.

Cons:

- Need to call station for every query.
- Possible inconsistency.

## Design: Overall Pros and Cons

Pros:

- No need to call station at all, so no dependency on station.
- Have a single as source of truth - Redshift.
- Have all calculations on Redshift side.

Cons:

- We do not reuse existing data. If we want to merge logic with My Performance Hub and Look Back features we potentially have some tech debt.
- Duplicating of Station data in Clinical KPI DB. (Reason: Need for keeping consistency between metrics and market/provider info)

## Platform Components

- Clinical KPI Service front-end
- Clinical KPI Service back-end
- DE pipeline

## Data Design & Schema Changes

Add new tables to Clinical KPI data base

### Calculated Data Option 1

- market_metrics
  - market_id: number (primary key)
  - on_scene_time_average_minutes: float
  - on_scene_time_week_change_minutes: float
  - chart_closure_rate_average: float, range 0-1
  - chart_closure_rate_week_change: float, range 0-1
  - survey_capture_rate_average: float, range 0-1
  - survey_capture_rate_week_change: float, range 0-1
  - net_promoter_score_average: float, range 0-100
  - net_promoter_score_week_change: float, range 0-100
- market_provider_metrics
  - id: number (primary key)
  - provider_id: number
  - market_id: number
  - on_scene_time_average_minutes: float
  - on_scene_time_week_change_minutes: float
  - chart_closure_rate_average: float, range 0-1
  - chart_closure_rate_week_change: float, range 0-1
  - survey_capture_rate_average: float, range 0-1
  - survey_capture_rate_week_change: float, range 0-1
  - net_promoter_score_average: float, range 0-100
  - net_promoter_score_week_change: float, range 0-100
  - on_task_percent_average: float
  - on_task_percent_week_change: float
- provider_metrics
  - provider_id: number (primary key)
  - on_scene_time_average_minutes: float
  - chart_closure_rate_average: float, range 0-1
  - survey_capture_rate_average: float, range 0-1
  - net_promoter_score_average: float, range 0-100
  - on_task_percent_average: float
  - escalation_rate_average: float, range 0-1
  - abx_prescribing_rate_average: float, range 0-1

### Calculated Data Option 2

- market_metrics
  - market_id: number (primary key)
  - date: date
  - visit_count: number
  - on_scene_time_average_minutes: float
  - chart_closure_rate_average: float, range 0-1
  - survey_capture_rate_average: float, range 0-1
  - net_promoter_score_average: float, range 0-100
- market_provider_metrics
  - id: number (primary key)
  - provider_id: number
  - market_id: number
  - date: date
  - visit_count: number
  - on_scene_time_average_minutes: float
  - chart_closure_rate_average: float, range 0-1
  - survey_capture_rate_average: float, range 0-1
  - net_promoter_score_average: float, range 0-100
  - on_task_percent_average: float
- provider_metrics
  - provider_id: number (primary key)
  - date: date
  - visit_count: number
  - on_scene_time_average_minutes: float
  - chart_closure_rate_average: float, range 0-1
  - survey_capture_rate_average: float, range 0-1
  - net_promoter_score_average: float, range 0-100
  - on_task_percent_average: float
  - escalation_rate_average: float, range 0-1
  - abx_prescribing_rate_average: float, range 0-1

### Static data Option 1:

- provider_visits
  - id: number (primary key)
  - care_request_id: number
  - provider_id: number
  - patient_first_name: string
  - patient_last_name: string
  - patient_athena_id: string
  - service_date: date
  - chief_complaint: string
  - diagnosis: string
  - is_abx_prescribed: bool
  - abx_details: string
  - is_escalated: bool
  - escalated_reason: string
- provider_shifts
  - id: number (primary key)
  - shift_team_id: number
  - provider_id: number
  - service_date: date
  - start_time: timestamp without timezone
  - end_time: timestamp without timezone
  - patients_seen: number
  - out_the_door_duration_seconds: number
  - en_route_duration_seconds: number
  - on_scene_duration_seconds: number
  - on_break_duration_seconds: number
  - idle_duration_seconds: number
- provider_shift_breakdowns
  - id: number (primary key)
  - provider_shift_id: number
  - start_time: timestamp without timezone
  - end_time: timestamp without timezone
  - stage: string (enum: on_scene, on_route, break, idle)
  - latitude_e6: number
  - longitude_e6: number
- providers
  - provider_id: number (primary key, user_id from Station)
  - first_name: string
  - last_name: string
  - avatar_url: string
  - job_title: string (enum: app, dhmt)
- markets
  - market_id: number (primary key, market_id from Station)
  - name: string
  - short_name: string
  - market_group_id: number
- market_groups
  - market_group_id: number (primary key, market_group_id from Redshift)
  - name: string
  - short_name: string

### Static data Option 2:

- provider_visits
  - id: number (primary key)
  - care_request_id: number
  - provider_id: number
  - patient_first_name: string
  - patient_last_name: string
  - patient_athena_id: string
  - date: date
  - chief_complaint: string
  - diagnosis: string
  - is_abx_prescribed: bool
  - abx_details: string
  - is_escalated: bool
  - escalated_reason: string
- provider_shifts
  - shift_team_id: number (primary key)
  - provider_id: number
  - date: date
  - start_time: timestamp without timezone
  - end_time: timestamp without timezone
  - patients_seen: number
  - out_the_door_duration_seconds: number
  - en_route_duration_seconds: number
  - on_scene_duration_seconds: number
  - on_break_duration_seconds: number
  - idle_duration_seconds: number
- provider_shift_breakdowns
  - id: number (primary key)
  - provider_shift_id: number
  - start_time: timestamp without timezone
  - end_time: timestamp without timezone
  - stage: string (enum: on_scene, on_route, break, idle)
  - latitude_e6: number
  - longitude_e6: number

## Metrics & Data Integration

This view would use Datadog for metrics and monitoring.

## Error Handling & Alerting

DataDog logs and Slack alerts for errors

## Safety

Based on the access controls described [here](<link to Design (Back-End) section>), PHI safety concerns have been mitigated because only users who have permission to view PHI will be granted access.

## Security

Are there any unusual security concerns around this design?

- New endpoints or methods of interaction within the system?
  - There are new endpoints, but nothing out of the ordinary compared to what these existing services were doing before.
- New dependencies on external systems?
  - No
- New third party libraries?
  - No

## Audits and Logs

Datadog will be added for logging and no extra audits will be added to the existing application.

## Scalability

N/A

## Cost

No extra costs

## Experimentation

Statsig will be used to control access to the Leads view page once this is released to production

## Testing

Standard testing following _company-data-covered_ standards:

- unit tests
- auto tests
  - open performance hub as lead app/dhmt
    - see my performance hub with "leads view" button
    - press "leads view" button in header
    - see leads view: metrics and list of providers
    - select provider
    - see providers metrics, visits and shifts
    - check shift breakdowns
    - see breakdowns
  - open performance hub as RDO/RMD, Area or Market manager
    - see leads view: metrics and list of providers
    - select provider
    - see providers metrics, visits and shifts
    - check shift breakdowns
    - see breakdowns

## Training

- Litmos course for leads
- Optisign for Leads
- Knowledge Base Article
- Pilot phases for rolling out to specific groups of leads

## Deployment

To deploy changes as part of Clinical KPI Service

## Lifecycle management

No changes.
