# Logistics Service Runbook

Status: Live in production

- Enabled for various markets
- [Oncall notes](http://go/logistics-oncall-notes)

## Contacts

TLs: Toliver Jue, Stephen Li

Teams Channel: [Logistics](https://teams.microsoft.com/l/channel/19%3a2a95f6642d784b16bda9de814261329d%40thread.skype/Logistics?groupId=009ea11a-44dc-4801-a63d-baff87ef5da4&tenantId=3b72a275-9e6a-4be0-a2a9-2b071f323fcc)

- Message the channel in case of any questions. Anyone in channel should be able to help you.

## Deploys

Deploys should only come from `trunk` in Github Actions workflows:

[Deploying a service to aptible via github actions](https://*company-data-covered*.atlassian.net/wiki/spaces/EC/pages/89194584/Deploying+A+Service+To+Aptible+Via+Github+Actions)

Deploys of binaries should follow this order:

1. Logistics Optimizer ("Optimizer") - stateless service
2. **OPTIONAL**: Reset DB (QA/UAT if needed) - drops the database
3. Logistics Service ("Logistics/Go")
   - runs migrations
   - deploys Logistics/Go service

## Monitoring

Prod Grafana:

- [Logistics GRPC](https://grafana.*company-data-covered*.com/d/q8c1sYk4k/logistics-service?orgId=1)
- [Production Services](https://grafana.*company-data-covered*.com/d/production/production?orgId=1)

Aptible Dashboard:

- [logistics-service-prod](https://dashboard.aptible.com/apps/39953/services)
- [logistics-optimizer-prod](https://dashboard.aptible.com/apps/40342/services)

## Diagnostics

### Check binary versions

Use healthcheck endpoints to get version information

```sh
# SSH to access internal network, via Station
$ aptible ssh --app dashboard-prod

# Get info about Logistics/Go in prod
$ curl logistics-service-prod.*company-data-covered*.com:8080/healthcheck
{
  "db": true,
  "maps": true,
  "optimizer": true,
  "diagnostics": {
    "googlemaps": false,
    "osrm": true,
    "version": "76428c1c7c9a87a7a36af13be7dacfccd99b17b5"
  }
}

# Get info about Optimizer in prod
$ curl logistics-optimizer-prod.*company-data-covered*.com:8181/healthcheck
{"optimizer":true,"version":"c4773a60c7c87ac253c5e8772e83d4f2c0bbc453"}
```

### Check logs

```sh
# Logistics/Go in prod
$ aptible logs --app logistics-service-prod

# Optimizer in prod
$ aptible logs --app logistics-optimizer-prod
```

### Check failed upserts

```sh
$ aptible ssh --app dashboard-prod
$ bin/rails c

# See retryable upserts, including all upsertable types
# Current only retryable status code is `14 UNAVAILABLE`.
# Upsertable types: CareRequest, ShiftTeam, Market, Car
> LogisticsServiceUpsert.retryable
# List number of retryable upserts by upsertable type
> LogisticsServiceUpsert.retryable_count("CareRequest")
# See pending upserts by upsertable type
> LogisticsServiceUpsert.pending_queue_count("CareRequest")
```

#### Retry failed upserts

```sh
$ aptible ssh --app dashboard-prod
$ bundle exec rake logistics_service:replay_failed
```

### Bootstrap syncing upserts from past

Retries should be automatically handled, but bootstrapping may be needed to load data from past after adding a new market to syncing.

```
$ aptible ssh --app dashboard-prod
$ CARE_REQUESTS=true SHIFT_TEAMS=true RELATIVE_TIMESTAMP_SEC=-86400 MARKETS=LAX,RIV,OCC,SAN,TUL bundle exec rake logistics_service:upsert
```

### Check Assignability

Assignable shift teams can be checked through the manual assignment flow, but this triggers new creations of care request statuses, to prevent this we can do it on the rails console, with the following commands.

```ruby
      shift_teams_response = LogisticsGRPC::Client.new.get_assignable_shift_teams(care_request_id, { start: time_to_start, end: time_to_end })
      shift_teams = ShiftTeamAssignableResponseSerializer.as_json(shift_teams_response)
```

#### Check assignable visits for virtual doctor shift teams

Virtual doctor shift teams are not auto assignable, so they are not upserted into the logistics DB. In oder to check
if there are assignable visits for a virtual shift team use the following ruby console command:

```ruby
    LogisticsGRPC::Client.new.get_assignable_visits(shift_team, { markets: market_id })
```

### Move Care Request to Billing Queue

Sometimes we are requested to move the status of a care request that for specific reasons fails in the middle of the process and cannot be completed through the normal flow. The problem can be:

- providers don't have internet when visiting the patient
- some problems on production that disable the ability to check out a care request

```ruby
aptible ssh --app dashboard-prod
CARE_REQUEST_IDS=1634480,1644170 EMAIL=<insert your Dispatch Health email here> bundle exec rake logistics_service:move_to_billing_queue
```

### Check database

Use the database replica to read data.

```sh
# Tunnel to database
$ aptible db:tunnel logistics-service-db-prod-replica
...
Connect at postgresql://<user/password>@localhost.aptible.in:51411/db
...

# Connect using psql in separate terminal to connect to tunnel locally
$ psql <postgresql URL>
```

#### Check for bad schedules

Check for bad schedules, with out of order routes.

TODO: Handle rest breaks.

```sql
-- Find out of order schedules, in service_region, on service_date.
-- See the schedule_id where it occurs.
WITH expected_order AS (
    SELECT
        optimizer_runs.id optimizer_run_id,
        schedules.id schedule_id,
        schedule_routes.id route_id,
        schedule_routes.*,
        schedule_stops.route_index,
        schedule_visits.visit_snapshot_id,
        rank () OVER (
            PARTITION BY schedule_stops.schedule_route_id
            ORDER BY
                schedule_visits.arrival_timestamp_sec
        ) rank_number
    FROM
        schedules
        JOIN schedule_stops ON schedule_stops.schedule_id = schedules.id
        JOIN schedule_routes ON schedule_stops.schedule_route_id = schedule_routes.id
        JOIN schedule_visits ON schedule_stops.schedule_visit_id = schedule_visits.id
        JOIN optimizer_runs ON schedules.optimizer_run_id = optimizer_runs.id
    WHERE
        schedules.service_region_id = 46
        AND optimizer_runs.service_date = '2022-10-07'
)
SELECT
    *
FROM
    expected_order
WHERE
    rank_number != route_index;

-- Print out visits in schedule, for schedule_id
SELECT
    schedule_stops.schedule_id,
    schedule_stops.schedule_route_id,
    shift_team_snapshots.shift_team_id,
    schedule_stops.route_index,
    visit_snapshots.care_request_id,
    schedule_visits.arrival_timestamp_sec visit_arrival_timestamp_sec,
    shift_team_rest_break_requests.start_timestamp_sec break_start_timestamp_sec
FROM
    schedules
    JOIN schedule_stops ON schedule_stops.schedule_id = schedules.id
    LEFT JOIN schedule_routes ON schedule_routes.id = schedule_stops.schedule_route_id
    LEFT JOIN shift_team_snapshots ON schedule_routes.shift_team_snapshot_id = shift_team_snapshots.id
    LEFT JOIN schedule_visits ON schedule_visits.id = schedule_stops.schedule_visit_id
    LEFT JOIN visit_snapshots ON visit_snapshots.id = schedule_visits.visit_snapshot_id
    LEFT JOIN schedule_rest_breaks ON schedule_rest_breaks.id = schedule_stops.schedule_rest_break_id
    LEFT JOIN shift_team_rest_break_requests ON schedule_rest_breaks.shift_team_break_request_id = shift_team_rest_break_requests.id
WHERE
    schedules.id = 10164
ORDER BY
    schedule_route_id,
    route_index;

-- Print out visits in latest optimizer run's schedule, for given region/date.
SELECT
    schedule_stops.schedule_id,
    schedule_stops.schedule_route_id,
    shift_team_snapshots.shift_team_id,
    schedule_stops.route_index,
    visit_snapshots.care_request_id,
    visit_snapshots.location_id,
    to_timestamp(schedule_visits.arrival_timestamp_sec) visit_arrival_timestamp_sec,
    to_timestamp(
        schedule_visits.arrival_timestamp_sec + visit_snapshots.service_duration_sec
    ) visit_complete_timestamp_sec,
    visit_snapshots.service_duration_sec * INTERVAL '1 sec' service_duration_sec,
    to_timestamp(
        shift_team_rest_break_requests.start_timestamp_sec
    ) break_start_timestamp_sec,
    visit_phase_types.description
FROM
    schedules
    JOIN schedule_stops ON schedule_stops.schedule_id = schedules.id
    LEFT JOIN schedule_routes ON schedule_routes.id = schedule_stops.schedule_route_id
    LEFT JOIN shift_team_snapshots ON schedule_routes.shift_team_snapshot_id = shift_team_snapshots.id
    LEFT JOIN schedule_visits ON schedule_visits.id = schedule_stops.schedule_visit_id
    LEFT JOIN visit_snapshots ON visit_snapshots.id = schedule_visits.visit_snapshot_id
    LEFT JOIN visit_phase_snapshots ON visit_snapshots.id = visit_phase_snapshots.visit_snapshot_id
    LEFT JOIN visit_phase_types ON visit_phase_types.id = visit_phase_snapshots.visit_phase_type_id
    LEFT JOIN schedule_rest_breaks ON schedule_rest_breaks.id = schedule_stops.schedule_rest_break_id
    LEFT JOIN shift_team_rest_break_requests ON schedule_rest_breaks.shift_team_break_request_id = shift_team_rest_break_requests.id
WHERE
    schedules.optimizer_run_id IN (
        SELECT
            id
        FROM
            optimizer_runs
        WHERE
            service_region_id = 7
            AND service_date = '2022-11-09'
        ORDER BY
            created_at DESC
        LIMIT
            1
    )
ORDER BY
    schedules.created_at,
    schedule_route_id,
    route_index;
```

## Kill switches

Kill switches are ways to stop the services in case of emergencies.

### Data syncing

- Overall kill switch: Disable all syncing

  [enable_station_logistics_service_sync](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/enable_station_logistics_service_sync) - Stop all data syncing Station -> Logistics/Go

  - Use in emergency, if you're seeing any problems from Station
    - Flip to `false`
      - Should immediately stop all forms of syncing

- Shift teams, by market

  [logistics_send_market_shift_teams_to_lp](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_send_market_shift_teams_to_lp)

  - Per market control of shift team data syncing.
  - Disable some markets if you're seeing high load that cannot be handled.
    - Remove market short names (e.g., `DEN` = Denver) from `enable_go_market_short_names`
      - Should immediately stop data syncing for those markets

- Care requests, by market

  [logistics_send_market_care_requests_to_lp](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_send_market_care_requests_to_lp)

  - Per market control of care request data syncing to Logistics/Go and Logistics/Elixir
  - Disable some markets if you're seeing high load that cannot be handled
    - Remove market short names (e.g., `DEN` = Denver) from `enable_go_market_short_names`
      - Should immediately stop data syncing for those markets

- Check Availability, by market

  [logistics_check_shift_teams_availability_lp](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_check_shift_teams_availability_lp)

  - Per market control of check availability for assignable shift of Logistics/Go
  - Disable some markets if you're seeing high load that cannot be handled.
    - Remove market short names (e.g., `DEN` = Denver) from `enable_go_market_short_names`
    - Should immediately stop check availability for shift teams in those markets

- Check feasibility on accepted care request

  [enable_accepted_care_request_feasibility_check](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/enable_accepted_care_request_feasibility_check)

  - Control of check availability when moving a care request to `accepted`. This is a last check before actually accepting a care request.

- No Active Status Cache

  [no_active_status_cache](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/no_active_status_cache)

  - When true, disables cache around active status for Care Requests in an LV1 market
  - Flip to false if seeing issues with LV1 care request statuses loading speed

- Enable Logistics GRPC Replay Failed Upserts

  [enable_logistics_grpc_replay_failed_upserts](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/enable_logistics_grpc_replay_failed_upserts)

  - When true, enables task to replay failed upserts every 5 minutes via Cron.
  - Disable to stop automatic running of `rake logistics_service:replay_failed`.

- Enable LV1 Acuity Prioritization in all markets

  [enable_lv1_acuity_prioritization](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/enable_lv1_acuity_prioritization)

  - LV1 Acuity Prioritization feature gate.

- Enable LV1 Care Request Prioritization

  [enable_lv1_care_request_prioritization](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/enable_lv1_prioritization)

  - LV1 Care Request Prioritization feature gate.

- Allow committing unordered advanced care visits

  [lv1_allow_commit_unordered_advance_care_visit](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/lv1_allow_commit_unordered_advance_care_visit)

  - Allows committing advanced care visits even if they are not next in a shift team schedule.

### Enable Markets for LV1 features

- List of service regions running LV1 optimization

  - Should control how schedule optimization is running for regions

  [logistics_optimizer_service_region_settings](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_optimizer_service_region_settings)

  - See [`statsig_service.go:StatsigServiceRegionSettingsJSON`](../../go/pkg/logistics/optimizer/optimizersettings/statsig_service.go) for JSON setting reference.

- List of markets with LV1 UI enabled

  - Should control all features being released to a market, including both backend and UI

  [lv1_launched_markets](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/lv1_launched_markets)

#### Onboarding UI

Managed by Providers team.

- Enable UI related to using Logistics/Go service
- Overall kill switch for Onboarding UI

  [onboarding_logistics_lv1_toggle](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/onboarding_logistics_lv1_toggle)

  - Talk to Provider team about usage
  - Used to enable access to new functionality enabled by Logistics/Go service

#### Provider/Optimizer UI

- Grace period in minutes before a late arrival visit is displayed in the "action needed" section.

  [logistics_running_late_grace_period](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_running_late_grace_period)

  - All the markets are affected.

- Shift team creation feature gate

  - [station_dashboard_scheduling_create_shift] ([Station Dashboard Scheduling Create Shift | Statsig](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/station_dashboard_scheduling_create_shift)
  - All the markets are affected.

- LV1 markets Queues list

  - [station_dashboard_queues_logistics_platform](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/station_dashboard_queues_logistics_platform)
    - List of LV1 markets for Assigned queue widgets.
    - Should be merged with `lv1_launched_markets`. (https://jira.*company-data-covered*.com/browse/PROV-1511).

- Schedule refresh interval
  - [provider_schedule_poll_intervals](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/provider_schedule_poll_intervals)
    - `shift_team_schedule_poll_interval_ms` - provider shift team schedule poll interval
    - `market_schedule_poll_interval_ms` - whole market schedule poll interval (for Manual Optimizer view)
  - All markets are affected.

#### Express UI

Managed by Partner team.

- Enable UI related to using Logistics/Go service
- Overall kill switch for Express UI

  [enable_lv1_for_express](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/enable_lv1_for_express)

  - Talk to Partner team about usage
  - Used to enable access to new functionality enabled by Logistics/Go service

#### Companion UI

Managed by Patient team.

- Enable UI to request real-time care request ETA and care request info at set intervals
  - Kill switch: [companion_status_tracking](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/gates/companion_status_tracking)
  - Polling interval in ms: [companion_eta_polling_interval_length](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/companion_eta_polling_interval_length)

## Environment Variables

### Switch on/off Google maps distance usage

Default distance source is OSRM. Enable Google Maps usage with these environment variables.

```sh
USE_GOOGLE_MAPS_DISTANCES=false # Use OSRM for distance information
USE_GOOGLE_MAPS_DISTANCES=true # Use Google Maps for distance information
```

### Debug optimizer VRP requests

Get optimizer run VRP requests from Logistics/Go, based on a particular `optimizer_run_id`.

```sh
# SSH to access internal network, via Station
$ aptible ssh --app dashboard-prod

# Get an optimizer run's VRP request
$ curl -v "logistics-service-prod.*company-data-covered*.com:8080/optimizer-run?id=<id>"
```

In Logistics Optimizer, print out VRP requests:

```sh
aptible config:set --app logistics-optimizer-<env> ENABLE_DEBUG_VRP_REQUESTS=true # Print out VRP requests in Optimizer
```

### Debug Check Feasibility requests

Get Check Feasibility history of a care request from Logistics/Go, based on a particular `care_request_id`.

```sh
# SSH to access internal network, via Station
$ aptible ssh --app dashboard-prod

# Get a care request's CheckFeasibility history
$ curl -v "logistics-service-prod.*company-data-covered*.com:8080/care-request-check-feasibility-history?id=<id>"
```

Get Check Feasibility Diagnostics on Check Feasibility response

```sh
aptible config:set --app logistics-service-<env> DEBUG_ENABLE_CHECK_FEASIBILITY_DIAGNOSTICS=true
```

### Change optimizer polling interval

Change [logistics_optimizer_service_region_settings](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_optimizer_service_region_settings) `poll_interval_sec`.

### Diagnose Acuity Prioritization

#### Verify the Acuity Model Service is returning expected information

```sh
$ aptible ssh --app dashboard-prod
$ bin/rails c

# See the acuity information for a given care request ID.
> EpisodeGRPC::AcuityHelper.care_request_acuity(care_request_id)
```

#### Verify acuity information is being recorded in logistics DB

Connect to the logistics service db replica using aptible and psql, then run:

```sql
SELECT
    visit_acuity_snapshots.*
FROM
    visit_acuity_snapshots
    JOIN visit_snapshots ON visit_acuity_snapshots.visit_snapshot_id = visit_snapshots.id
WHERE
    visit_snapshots.care_request_id = xxx
ORDER BY
    visit_acuity_snapshots.created_at DESC
LIMIT
    1;
```

### Enable virtual modality for Hybrid (a.k.a. tele-p) markets on phase 1

For Tele-p phase 1 we need to enable this flag, so we can do the following:

- Enable visits in a market to have `presentation_modality:virtual` attribute if is eligible for Tele-p
  - the reason of this is that insurances are configured by state, and we can have some insurances that are eligible for Tele-p on a market that doesn't have enabled Tele-p on it.
- When we make the GRPC call for get Assignable visits we use the markets on this flag to just send from station markets that has Tele-p enable to logistics service, so we avoid getting data for markets that we shouldn't care about

Add market short name [marketplace_lv1_telepresentation])(https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/marketplace_lv1_telepresentation) `markets`

## Enable Availability Runner

We make a separate the concepts for check feasibility and market availability, so we will have a new runner that generates availability schedules, to enable this runner we need to include the service region id in [logistics_availability_service_region_settings](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_availability_service_region_settings)

There are validations that were added along with this runner

- The service region id must need to exist on the optimizer runner settings otherwise this will trigger a validation error and optimizer runner and availability will start falling
- the section of `attributes` it is validated against what we have currently in database so for example we have:

```json
        attributes: [
          {
            name: 'service_name',
            variants: [
              'Acute',
            ],
          },
          {
            name: 'presentation_modality',
            variants: [
              'virtual',
            ],
          },
        ]
```

is important that we in our database exist the attributes `"service_name:Acute"` and `"presentation_modality:virtual"` if these attributes don't exist the availability schedule will not generate new availability schedule.

## Expected Issues on Production after Release

### Upsert Care Request

- `Failed Precondition` errors on Care request scheduled by `LAA` in the next 2 days on the future after turning on `LV1`. These care request are expected to be visible in the `Action Needed` section.
  - Solution: Adjust the Care Requests that are failing adding an Eta range using the Action Needed section.

## Enabling markets/service regions

Service regions are an agglomeration of markets, but currently there's a 1-1 mapping of market->service region.

0. Check status of a market by checking diagnostics.

   Use this command to check status after each step.

   ```sh
   $ aptible ssh --app dashboard-prod
   $ curl -v logistics-service-prod.*company-data-covered*.com:8080/market?id=198
   ```

   Proto: [logistics.MarketDiagnostics](../../proto/logistics/service.proto#MarketDiagnostics)

   Look for `lv1_launchable: true`. If not there, continue to next steps to get ready to launch.

   ```json
    {
      "market": {
        "market_id": "198",
        "lv1_launchable": true, # Ready to launch
        "lv1_ui_enabled": true, # Enabled in UI
        "market_short_name": "COL",
        "service_region_id": "10",
        "sync": {
          "enabled": true,
          "shift_teams": true,
          "care_requests": true
        },
        "optimizer_runs": {
          "enabled": true,
          "horizon_days": "5",
          "poll_interval_sec": "60",
          "optimizer_config_id": "1"
        },
        "availability_runs": {
          "enabled": true,
          "poll_interval_sec": "60",
          "attributes": [
            {
              "name": "service_name",
              "variants": ["Acute", "Bridge", "Advanced"]
            },
            {
              "name": "presentation_modality",
              "variants": ["in_person", "virtual"]
            }
          ],
          "capacity_settings": [
            {
              "shift_team_attributes": ["service_name:Acute"],
              "capacity_percent_for_horizon_days": [100, 60]
            }
          ]
        },
        "feasibility": {
          "enabled": true,
          "locations": {
            "locations": [
              {
                "latitude_e6": 39986633,
                "longitude_e6": -82626003
              },
              {
                "latitude_e6": 40006579,
                "longitude_e6": -83023272
              }
            ]
          },
          "min_visit_duration_sec": "1020",
          "max_visit_duration_sec": "2616"
        },
        "schedule": {
          "enabled": true,
          "days": [
            {
              "open_time": {
                "hours": 8
              },
              "close_time": {
                "hours": 22
              }
            },
            {
              "day_of_week": 1,
              "open_time": {
                "hours": 8
              },
              "close_time": {
                "hours": 22
              }
            },
            {
              "day_of_week": 2,
              "open_time": {
                "hours": 8
              },
              "close_time": {
                "hours": 22
              }
            },
            {
              "day_of_week": 3,
              "open_time": {
                "hours": 8
              },
              "close_time": {
                "hours": 22
              }
            },
            {
              "day_of_week": 4,
              "open_time": {
                "hours": 8
              },
              "close_time": {
                "hours": 22
              }
            },
            {
              "day_of_week": 5,
              "open_time": {
                "hours": 8
              },
              "close_time": {
                "hours": 22
              }
            },
            {
              "day_of_week": 6,
              "open_time": {
                "hours": 8
              },
              "close_time": {
                "hours": 22
              }
            }
          ]
        }
      }
    }
   ```

1. Enable data syncing, for both shift teams and care requests. Verify the market short names (`COL`, `FTL`) are in the enabled lists.

   See [Diagnostics](#diagnostics) section for what the flags do.

   [logistics_send_market_shift_teams_to_lp](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_send_market_shift_teams_to_lp)

   [logistics_send_market_care_requests_to_lp](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_send_market_care_requests_to_lp)

2. Verify the schedule days. Look for `enabled: true` under `schedule`.

   This configuration needs to be in place prior to enable optimizer schedule runs. The schedule days can be found in Dashboard > Markets > select the needed market.

3. Enable optimizer schedule runs on service region (`10` -> `COL`, `14` -> `FTL`).

   - Ideally at least a few days early, to verify functionality and load
   - Check grafana graphs for errors

   Update Statsig to enable optimizer to create schedules against the sync'd data, with the service region ID.

   [logistics_optimizer_service_region_settings](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_optimizer_service_region_settings)

4. Add canonical locations/minimum/maximum service duration for the service region.

   Canonical locations are used to check feasibility of the region when there is no location supplied (e.g., whole market check).

   If there are no canonical location sets, contact Data Science to generate canonical location sets, and add them.

   - [Docs on canonical location set generation](https://github.com/*company-data-covered*/ds-data_science/tree/main/availability)

   ```sh
   # Assuming you get file market_rep_locs.csv from Data Science, get the market id 198 to upload in next step.
   $ python scripts/logistics/market_canonical_locations.py --csv market_rep_locs.csv  --target-market-id 198
    {
      "market_id": 198,
      "locations": {
        "locations": [
          {
            "latitude_e6": 39972674,
            "longitude_e6": -82622713
          },
          {
            "latitude_e6": 40001684,
            "longitude_e6": -83029586
          }
        ]
      }
    }

   $ aptible ssh --app dashboard-prod

   # Add canonical locations/minimum service duration by pasting in JSON in stdin. Press ctrl-D to finish stdin.
   # Look for HTTP 200 OK for success.
   $ curl -v -d @- logistics-service-prod.*company-data-covered*.com:8080/market/feasibility
   {
     "market_id": 198,
     "min_visit_duration_sec": 1200, # Optional
     "max_visit_duration_sec": 2616, # Optional must be higher than min_visit_duration_sec
     "locations": {
       "locations": [
         {
           "latitude_e6": 38254221,
           "longitude_e6": -85640839
         },
         {
           "latitude_e6": 38254222,
           "longitude_e6": -85640838
         }
       ]
     }
   }

   # Check market status again.
   $ curl -v logistics-service-prod.*company-data-covered*.com:8080/market?id=198
   ```

5. Enable Optimizer availability runs on service region (`10` -> `COL`, `14` -> `FTL`).

   - Needs to be done after enabling Optimizer schedule runs
   - Like the schedule runs, should be enabled at least a few days early to verify functionality and load
   - Check grafana graphs for errors

   Update Statsig to enable optimizer to create availability runs against the sync'd data, with the service region ID.

   [logistics_availability_service_region_settings](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_availability_service_region_settings)

6. Enable market in UI, at release time.

   [lv1_launched_markets](https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/lv1_launched_markets)

## Troubleshooting

### Disappearing care requests

<!-- TODO(MARK-2264): Remove this section once the issue is fixed. -->

If one or more accepted care requests disappeared from the UI in markets with tele-p enabled, we may be mistakenly assigning them to a virtual shift team ([MARK-2264](https://*company-data-covered*.atlassian.net/browse/MARK-2264)).

Check the `/schedules` endpoint. The schedule will have more shift teams than the total of shift teams displayed in the UI. Verify in Station that those extra shifts have the `virtual` modality.

Connect to database and remove each of the extra virtual shifts by inserting a delete row:

```sql
insert into shift_team_snapshots
(
	shift_team_id,
	service_region_id,
	base_location_id,
	start_timestamp_sec,
	end_timestamp_sec,
	deleted_at,
	num_app_members,
	num_dhmt_members
)
select
	shift_team_id,
	service_region_id,
	base_location_id,
	start_timestamp_sec,
	end_timestamp_sec,
	CURRENT_TIMESTAMP,
	num_app_members,
	num_dhmt_members
from shift_team_snapshots
where shift_team_id = <SHIFT_TEAM_ID>
	order by created_at desc
	limit 1;
```

You may want to run the `select` statement first to make sure you're copying over the right data.
