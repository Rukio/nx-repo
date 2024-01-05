-- name: AddSchedule :one
INSERT INTO
    schedules (
        service_region_id,
        optimizer_run_id,
        hard_score,
        unassigned_visits_score,
        soft_score,
        optimizer_version
    )
VALUES
    ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: AddScheduleDiagnostics :one
INSERT INTO
    schedule_diagnostics (
        schedule_id,
        debug_explanation,
        unassigned_visits_diff
    )
VALUES
    ($1, $2, $3) RETURNING *;

-- name: GetDiagnosticsForSchedule :one
SELECT
    *
FROM
    schedule_diagnostics
WHERE
    schedule_id = $1;

-- name: GetDiagnosticsForScheduleBatch :batchone
SELECT
    *
FROM
    schedule_diagnostics
WHERE
    schedule_id = $1;

-- name: GetSchedule :one
SELECT
    *
FROM
    schedules
WHERE
    id = $1;

-- name: AddScheduleStats :one
INSERT INTO
    schedule_stats (
        schedule_id,
        drive_duration_sec,
        drive_distance_meters,
        service_duration_sec
    )
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: GetScheduleStats :one
SELECT
    *
FROM
    schedule_stats
WHERE
    schedule_id = $1;

-- name: AddUnassignedScheduleVisitsToSchedule :many
INSERT INTO
    unassigned_schedule_visits (
        schedule_id,
        visit_snapshot_id,
        service_region_availability_visit_id
    )
SELECT
    $1 AS schedule_id,
    unnest(sqlc.arg(visit_snapshot_ids) :: BIGINT [ ]) AS visit_snapshot_id,
    unnest(
        sqlc.arg(service_region_availability_visit_ids) :: BIGINT [ ]
    ) AS service_region_availability_visit_id RETURNING *;

-- name: AddScheduleRoutes :many
INSERT INTO
    schedule_routes (
        schedule_id,
        shift_team_snapshot_id,
        depot_arrival_timestamp_sec
    )
SELECT
    unnest(sqlc.arg(schedule_ids) :: BIGINT [ ]) AS schedule_id,
    unnest(sqlc.arg(shift_team_snapshot_ids) :: BIGINT [ ]) AS shift_team_snapshot_id,
    unnest(sqlc.arg(depot_arrival_timestamps_sec) :: BIGINT [ ]) AS depot_arrival_timestamp_sec RETURNING *;

-- name: AddScheduleVisitStops :many
INSERT INTO
    schedule_stops (
        schedule_id,
        schedule_route_id,
        route_index,
        schedule_visit_id
    )
SELECT
    unnest(sqlc.arg(schedule_ids) :: BIGINT [ ]) AS schedule_id,
    unnest(sqlc.arg(schedule_route_ids) :: BIGINT [ ]) AS schedule_route_id,
    unnest(sqlc.arg(route_indexes) :: INTEGER [ ]) AS route_index,
    unnest(sqlc.arg(schedule_visit_ids) :: BIGINT [ ]) AS schedule_visit_id RETURNING *;

-- name: AddScheduleRestBreakStops :many
INSERT INTO
    schedule_stops (
        schedule_id,
        schedule_route_id,
        route_index,
        schedule_rest_break_id
    )
SELECT
    unnest(sqlc.arg(schedule_ids) :: BIGINT [ ]) AS schedule_id,
    unnest(sqlc.arg(schedule_route_ids) :: BIGINT [ ]) AS schedule_route_id,
    unnest(sqlc.arg(route_indexes) :: INTEGER [ ]) AS route_index,
    unnest(sqlc.arg(schedule_rest_break_ids) :: BIGINT [ ]) AS schedule_rest_break_id RETURNING *;

-- name: AddScheduleVisit :one
INSERT INTO
    schedule_visits (
        schedule_id,
        schedule_route_id,
        visit_snapshot_id,
        service_region_availability_visit_id,
        arrival_timestamp_sec
    )
VALUES
    ($1, $2, $3, $4, $5) RETURNING *;

-- name: AddScheduleRestBreak :one
INSERT INTO
    schedule_rest_breaks (
        schedule_id,
        schedule_route_id,
        shift_team_break_request_id
    )
VALUES
    ($1, $2, $3) RETURNING *;

-- name: GetLatestScheduleInfoForServiceRegionDate :one
SELECT
    schedules.id schedule_id,
    optimizer_runs.snapshot_timestamp
FROM
    schedules
    JOIN optimizer_runs ON schedules.optimizer_run_id = optimizer_runs.id
    JOIN optimizer_run_types ON optimizer_run_types.id = optimizer_runs.optimizer_run_type_id
WHERE
    optimizer_runs.service_region_id = sqlc.arg(service_region_id)
    AND optimizer_runs.service_date = sqlc.arg(service_date)
    AND optimizer_run_types.name = sqlc.arg(optimizer_run_type)
    AND schedules.created_at <= sqlc.arg(created_before)
ORDER BY
    optimizer_runs.created_at DESC,
    schedules.created_at DESC
LIMIT
    1;

-- name: GetLatestScheduleRouteVisitForVisitSnapshotID :one
SELECT
    schedule_routes.shift_team_snapshot_id,
    schedule_visits.*
FROM
    schedule_visits
    JOIN schedule_routes ON schedule_visits.schedule_route_id = schedule_routes.id
    JOIN schedules ON schedule_routes.schedule_id = schedules.id
WHERE
    schedule_visits.visit_snapshot_id = $1
ORDER BY
    schedules.created_at DESC
LIMIT
    1;

-- name: GetLatestScheduleRouteForShiftTeamID :one
SELECT
    optimizer_runs.id optimizer_run_id,
    schedules.id schedule_id,
    schedule_routes.id route_id,
    shift_team_snapshots.id shift_team_snapshot_id,
    shift_team_snapshots.base_location_id shift_team_base_location_id,
    shift_team_snapshots.shift_team_id,
    optimizer_runs.service_region_id,
    optimizer_runs.service_date,
    optimizer_runs.snapshot_timestamp,
    optimizer_runs.created_at optimizer_run_created_at
FROM
    schedule_routes
    JOIN schedules ON schedule_routes.schedule_id = schedules.id
    JOIN optimizer_runs ON schedules.optimizer_run_id = optimizer_runs.id
    JOIN optimizer_run_types ON optimizer_run_types.id = optimizer_runs.optimizer_run_type_id
    JOIN shift_team_snapshots ON schedule_routes.shift_team_snapshot_id = shift_team_snapshots.id
WHERE
    shift_team_snapshots.shift_team_id = $1
    AND schedules.created_at <= sqlc.arg(latest_schedule_timestamp)
    AND schedule_routes.created_at <= sqlc.arg(latest_schedule_timestamp)
    AND schedule_routes.created_at >= sqlc.arg(earliest_schedule_timestamp)
    AND schedules.created_at >= sqlc.arg(earliest_schedule_timestamp)
    AND optimizer_run_types.name = 'service_region_schedule'
ORDER BY
    optimizer_runs.created_at DESC,
    schedules.created_at DESC
LIMIT
    1;

-- name: GetScheduleRouteStopsForScheduleRouteID :many
WITH latest_clinical_urgency_level_configs AS (
    SELECT
        DISTINCT ON(clinical_urgency_level_id) clinical_urgency_level_id,
        clinical_urgency_level_configs.clinical_window_duration_sec
    FROM
        clinical_urgency_level_configs
    WHERE
        clinical_urgency_level_configs.created_at <= sqlc.arg(latest_snapshot_time)
    ORDER BY
        clinical_urgency_level_id,
        clinical_urgency_level_configs.created_at DESC
)
SELECT
    schedule_stops.*,
    shift_team_rest_break_requests.start_timestamp_sec AS break_request_start_timestamp_sec,
    shift_team_rest_break_requests.id AS break_request_id,
    shift_team_rest_break_requests.duration_sec AS break_request_duration_sec,
    shift_team_rest_break_requests.location_id AS break_request_location_id,
    schedule_visits.arrival_timestamp_sec,
    schedule_visits.visit_snapshot_id,
    schedule_routes.depot_arrival_timestamp_sec,
    visit_phase_types.short_name AS visit_phase_short_name,
    visit_snapshots.care_request_id,
    visit_snapshots.arrival_start_timestamp_sec,
    visit_snapshots.arrival_end_timestamp_sec,
    visit_snapshots.service_duration_sec,
    visit_snapshots.location_id AS visit_location_id,
    latest_clinical_urgency_level_configs.clinical_window_duration_sec AS visit_clinical_urgency_window_sec,
    visit_acuity_snapshots.clinical_urgency_level_id AS visit_clinical_urgency_level_id
FROM
    schedule_stops
    JOIN schedule_routes ON schedule_stops.schedule_route_id = schedule_routes.id
    LEFT JOIN schedule_rest_breaks ON schedule_stops.schedule_rest_break_id = schedule_rest_breaks.id
    LEFT JOIN shift_team_rest_break_requests ON schedule_rest_breaks.shift_team_break_request_id = shift_team_rest_break_requests.id
    LEFT JOIN schedule_visits ON schedule_stops.schedule_visit_id = schedule_visits.id
    LEFT JOIN visit_snapshots ON schedule_visits.visit_snapshot_id = visit_snapshots.id
    LEFT JOIN visit_acuity_snapshots ON visit_snapshots.id = visit_acuity_snapshots.visit_snapshot_id
    LEFT JOIN latest_clinical_urgency_level_configs ON visit_acuity_snapshots.clinical_urgency_level_id = latest_clinical_urgency_level_configs.clinical_urgency_level_id
    LEFT JOIN visit_phase_snapshots ON visit_snapshots.id = visit_phase_snapshots.visit_snapshot_id
    LEFT JOIN visit_phase_types ON visit_phase_snapshots.visit_phase_type_id = visit_phase_types.id
WHERE
    schedule_stops.schedule_route_id = sqlc.arg(schedule_route_id)
ORDER BY
    schedule_stops.schedule_route_id,
    schedule_stops.route_index;

-- name: GetScheduleRoutesForSchedule :many
SELECT
    schedule_routes.*,
    shift_team_snapshots.shift_team_id,
    locations.latitude_e6 AS base_location_latitude_e6,
    locations.longitude_e6 AS base_location_longitude_e6
FROM
    schedule_routes
    JOIN shift_team_snapshots ON schedule_routes.shift_team_snapshot_id = shift_team_snapshots.id
    JOIN locations ON locations.id = shift_team_snapshots.base_location_id
WHERE
    schedule_id = $1;

-- name: GetUnassignedScheduleVisitsForScheduleID :many
WITH latest_clinical_urgency_level_configs AS (
    SELECT
        DISTINCT ON(clinical_urgency_level_id) clinical_urgency_level_id,
        clinical_urgency_level_configs.clinical_window_duration_sec
    FROM
        clinical_urgency_level_configs
    WHERE
        clinical_urgency_level_configs.created_at <= sqlc.arg(latest_snapshot_time)
    ORDER BY
        clinical_urgency_level_id,
        clinical_urgency_level_configs.created_at DESC
)
SELECT
    unassigned_schedule_visits.*,
    visit_snapshots.care_request_id,
    visit_snapshots.arrival_start_timestamp_sec,
    visit_snapshots.arrival_end_timestamp_sec,
    latest_clinical_urgency_level_configs.clinical_window_duration_sec AS clinical_urgency_window_duration_sec,
    visit_acuity_snapshots.clinical_urgency_level_id AS clinical_urgency_level_id
FROM
    unassigned_schedule_visits
    JOIN visit_snapshots ON unassigned_schedule_visits.visit_snapshot_id = visit_snapshots.id
    LEFT JOIN visit_acuity_snapshots ON visit_snapshots.id = visit_acuity_snapshots.visit_snapshot_id
    LEFT JOIN latest_clinical_urgency_level_configs ON visit_acuity_snapshots.clinical_urgency_level_id = latest_clinical_urgency_level_configs.clinical_urgency_level_id
WHERE
    schedule_id = sqlc.arg(schedule_id)
ORDER BY
    unassigned_schedule_visits.id;

-- name: GetOptimizerRunForScheduleID :one
SELECT
    optimizer_runs.service_date,
    optimizer_runs.service_region_id,
    optimizer_runs.snapshot_timestamp
FROM
    schedules
    JOIN optimizer_runs ON optimizer_runs.id = schedules.optimizer_run_id
WHERE
    schedules.id = $1;

-- name: GetScheduleRouteStopsForSchedule :many
WITH latest_clinical_urgency_level_configs AS (
    SELECT
        DISTINCT ON(clinical_urgency_level_id) clinical_urgency_level_id,
        clinical_urgency_level_configs.clinical_window_duration_sec
    FROM
        clinical_urgency_level_configs
    WHERE
        clinical_urgency_level_configs.created_at <= sqlc.arg(latest_snapshot_time)
    ORDER BY
        clinical_urgency_level_id,
        clinical_urgency_level_configs.created_at DESC
)
SELECT
    schedule_stops.*,
    shift_team_rest_break_requests.start_timestamp_sec AS break_request_start_timestamp_sec,
    shift_team_rest_break_requests.id AS break_request_id,
    shift_team_rest_break_requests.duration_sec AS break_request_duration_sec,
    shift_team_rest_break_requests.location_id AS break_request_location_id,
    schedule_visits.arrival_timestamp_sec,
    schedule_visits.visit_snapshot_id,
    schedule_routes.depot_arrival_timestamp_sec,
    visit_phase_types.short_name AS visit_phase_short_name,
    visit_snapshots.care_request_id,
    visit_snapshots.arrival_start_timestamp_sec,
    visit_snapshots.arrival_end_timestamp_sec,
    visit_snapshots.service_duration_sec,
    visit_snapshots.location_id AS visit_location_id,
    latest_clinical_urgency_level_configs.clinical_window_duration_sec AS visit_clinical_urgency_window_sec,
    visit_acuity_snapshots.clinical_urgency_level_id AS visit_clinical_urgency_level_id
FROM
    schedule_stops
    JOIN schedule_routes ON schedule_stops.schedule_route_id = schedule_routes.id
    LEFT JOIN schedule_rest_breaks ON schedule_stops.schedule_rest_break_id = schedule_rest_breaks.id
    LEFT JOIN shift_team_rest_break_requests ON schedule_rest_breaks.shift_team_break_request_id = shift_team_rest_break_requests.id
    LEFT JOIN schedule_visits ON schedule_stops.schedule_visit_id = schedule_visits.id
    LEFT JOIN visit_snapshots ON schedule_visits.visit_snapshot_id = visit_snapshots.id
    LEFT JOIN visit_acuity_snapshots ON visit_snapshots.id = visit_acuity_snapshots.visit_snapshot_id
    LEFT JOIN latest_clinical_urgency_level_configs ON visit_acuity_snapshots.clinical_urgency_level_id = latest_clinical_urgency_level_configs.clinical_urgency_level_id
    LEFT JOIN visit_phase_snapshots ON visit_snapshots.id = visit_phase_snapshots.visit_snapshot_id
    LEFT JOIN visit_phase_types ON visit_phase_snapshots.visit_phase_type_id = visit_phase_types.id
WHERE
    schedule_stops.schedule_id = sqlc.arg(schedule_id)
ORDER BY
    schedule_stops.schedule_route_id,
    schedule_stops.route_index;

-- name: GetVisitsArrivalTimestampSecsForSchedule :many
SELECT
    schedule_visits.visit_snapshot_id,
    schedule_visits.arrival_timestamp_sec
FROM
    schedule_visits
WHERE
    schedule_id = $1;

-- name: GetCareRequestIDsAndPhasesFromVisitIDs :many
SELECT
    visit_snapshots.id visit_snapshot_id,
    visit_snapshots.care_request_id,
    visit_phase_types.short_name visit_phase_type_short_name
FROM
    visit_snapshots
    JOIN visit_phase_snapshots ON visit_snapshots.id = visit_phase_snapshots.visit_snapshot_id
    JOIN visit_phase_types ON visit_phase_snapshots.visit_phase_type_id = visit_phase_types.id
    JOIN(
        SELECT
            unnest(sqlc.arg(visit_ids) :: BIGINT [ ]) AS visit_id_input
    ) visit_ids ON visit_ids.visit_id_input = visit_snapshots.id;

-- name: GetLatestStatusCreatedAtForPhaseTypeID :many
SELECT
    DISTINCT ON (visit_snapshots.care_request_id) visit_snapshots.care_request_id AS care_request_id,
    visit_phase_snapshots.shift_team_id,
    visit_phase_snapshots.status_created_at
FROM
    visit_snapshots
    JOIN visit_phase_snapshots ON visit_snapshots.id = visit_phase_snapshots.visit_snapshot_id
    JOIN(
        SELECT
            unnest(sqlc.arg(care_request_ids) :: BIGINT [ ]) AS id
    ) care_request_ids ON care_request_ids.id = visit_snapshots.care_request_id
WHERE
    visit_phase_snapshots.visit_phase_type_id = sqlc.arg(visit_phase_type_id)
    AND visit_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
ORDER BY
    visit_snapshots.care_request_id,
    visit_phase_snapshots.status_created_at DESC,
    visit_phase_snapshots.created_at DESC;

-- name: GetVisitPhaseForVisitSnapshotsByCareRequestID :many
SELECT
    DISTINCT ON (visit_snapshots.care_request_id) visit_snapshots.care_request_id,
    visit_snapshots.id AS visit_snapshot_id,
    visit_phase_types.short_name AS visit_phase_short_name,
    visit_phase_snapshots.status_created_at,
    visit_phase_snapshots.shift_team_id
FROM
    visit_snapshots
    JOIN(
        SELECT
            unnest(sqlc.arg(visit_snapshot_ids) :: BIGINT [ ]) AS id
    ) visit_snapshot_ids ON visit_snapshot_ids.id = visit_snapshots.id
    JOIN visit_phase_snapshots ON visit_snapshot_ids.id = visit_phase_snapshots.visit_snapshot_id
    JOIN visit_phase_types ON visit_phase_snapshots.visit_phase_type_id = visit_phase_types.id
ORDER BY
    visit_snapshots.care_request_id,
    visit_snapshots.created_at DESC;

-- name: GetVisitPhaseTypeForShortName :one
SELECT
    *
FROM
    visit_phase_types
WHERE
    short_name = $1
LIMIT
    1;

-- name: GetVisitPhaseTypes :many
SELECT
    *
FROM
    visit_phase_types;

-- name: GetVisitPhaseSourceTypes :many
SELECT
    *
FROM
    visit_phase_source_types;

-- name: GetVisitPhaseTypeByID :one
SELECT
    *
FROM
    visit_phase_types
WHERE
    id = $1
LIMIT
    1;

-- name: GetVisitPhaseSourceTypeForShortName :one
SELECT
    *
FROM
    visit_phase_source_types
WHERE
    short_name = $1
LIMIT
    1;

-- name: GetLatestScheduleVisitForCareRequest :one
SELECT
    schedule_visits.*,
    visit_snapshots.service_region_id,
    visit_snapshots.location_id,
    shift_team_snapshots.shift_team_id,
    visit_phase_types.short_name AS visit_phase_short_name
FROM
    schedule_visits
    JOIN visit_snapshots ON visit_snapshots.id = schedule_visits.visit_snapshot_id
    JOIN visit_phase_snapshots ON visit_snapshots.id = visit_phase_snapshots.visit_snapshot_id
    JOIN visit_phase_types ON visit_phase_snapshots.visit_phase_type_id = visit_phase_types.id
    JOIN schedules ON schedules.id = schedule_visits.schedule_id
    JOIN optimizer_runs ON optimizer_runs.id = schedules.optimizer_run_id
    JOIN optimizer_run_types ON optimizer_run_types.id = optimizer_runs.optimizer_run_type_id
    JOIN schedule_routes ON schedule_visits.schedule_route_id = schedule_routes.id
    JOIN shift_team_snapshots ON shift_team_snapshots.id = schedule_routes.shift_team_snapshot_id
WHERE
    visit_snapshots.care_request_id = $1
    AND optimizer_run_types.name = 'service_region_schedule'
    AND schedules.created_at <= $2
ORDER BY
    schedules.created_at DESC
LIMIT
    1;
