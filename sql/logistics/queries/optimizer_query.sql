-- name: UpsertAttributes :many
INSERT INTO
    attributes (name)
SELECT
    unnest(sqlc.arg(attribute_names) :: TEXT [ ]) AS name ON CONFLICT ON CONSTRAINT attributes_unique_name DO NOTHING RETURNING *;

-- name: GetAttributesForNames :many
SELECT
    attributes.*
FROM
    attributes
    JOIN (
        SELECT
            unnest(sqlc.arg(attribute_names) :: TEXT [ ]) AS name
    ) attribute_names ON attributes.name = attribute_names.name
ORDER BY
    attributes.id;

-- name: AddShiftTeamSnapshot :one
INSERT INTO
    shift_team_snapshots (
        shift_team_id,
        service_region_id,
        base_location_id,
        start_timestamp_sec,
        end_timestamp_sec,
        deleted_at,
        num_app_members,
        num_dhmt_members
    )
SELECT
    sqlc.arg(shift_team_id) AS shift_team_id,
    sqlc.arg(service_region_id) AS service_region_id,
    sqlc.arg(base_location_id) AS base_location_id,
    sqlc.arg(start_timestamp_sec) AS start_timestamp_sec,
    sqlc.arg(end_timestamp_sec) AS end_timestamp_sec,
    sqlc.arg(deleted_at) AS deleted_at,
    sqlc.arg(num_app_members) AS num_app_members,
    sqlc.arg(num_dhmt_members) AS num_dhmt_members RETURNING *;

-- name: AddVisitSnapshot :one
INSERT INTO
    visit_snapshots (
        care_request_id,
        service_region_id,
        location_id,
        arrival_start_timestamp_sec,
        arrival_end_timestamp_sec,
        is_manual_override,
        service_duration_sec
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: AddVisitPhaseSnapshot :one
INSERT INTO
    visit_phase_snapshots (
        visit_snapshot_id,
        visit_phase_type_id,
        station_user_id,
        visit_phase_source_type_id,
        status_created_at,
        shift_team_id
    )
VALUES
    ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: AddVirtualAPPVisitPhaseSnapshot :one
INSERT INTO
    virtual_app_visit_phase_snapshots (
        visit_snapshot_id,
        virtual_app_visit_phase_type_id,
        visit_phase_source_type_id,
        station_user_id,
        shift_team_id
    )
VALUES
    ($1, $2, $3, $4, $5) RETURNING *;

-- name: GetVirtualAPPVisitPhaseSnapshotByVisitSnapshotID :one
SELECT
    virtual_app_visit_phase_snapshots.*
FROM
    virtual_app_visit_phase_snapshots
WHERE
    virtual_app_visit_phase_snapshots.visit_snapshot_id = $1
LIMIT
    1;

-- name: AddVisitAcuitySnapshot :one
INSERT INTO
    visit_acuity_snapshots (
        visit_snapshot_id,
        clinical_urgency_level_id,
        patient_age,
        chief_complaint
    )
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: GetClinicalUrgencyLevelByID :one
SELECT
    clinical_urgency_levels.*
FROM
    clinical_urgency_levels
WHERE
    clinical_urgency_levels.id = $1
LIMIT
    1;

-- name: GetVisitAcuitySnapshotByVisitSnapshotID :one
SELECT
    visit_acuity_snapshots.*
FROM
    visit_acuity_snapshots
WHERE
    visit_acuity_snapshots.visit_snapshot_id = $1
LIMIT
    1;

-- name: GetLatestVisitAcuitySnapshotByCareRequestID :one
SELECT
    visit_acuity_snapshots.*
FROM
    visit_acuity_snapshots
    JOIN visit_snapshots ON visit_acuity_snapshots.visit_snapshot_id = visit_snapshots.id
WHERE
    visit_snapshots.care_request_id = $1
    AND visit_acuity_snapshots.created_at <= $2
ORDER BY
    visit_acuity_snapshots.created_at DESC
LIMIT
    1;

-- name: AddVisitValueSnapshot :one
INSERT INTO
    visit_value_snapshots (
        visit_snapshot_id,
        completion_value_cents,
        partner_priority_score,
        partner_influenced_completion_value_cents
    )
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: GetVisitValueSnapshot :many
SELECT
    *
FROM
    visit_value_snapshots
WHERE
    visit_snapshot_id = $1
LIMIT
    1;

-- name: AddVisitPrioritySnapshot :one
INSERT INTO
    visit_priority_snapshots (
        visit_snapshot_id,
        requested_by_user_id,
        requested_timestamp_sec,
        note
    )
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: GetVisitPrioritySnapshot :one
SELECT
    *
FROM
    visit_priority_snapshots
WHERE
    visit_snapshot_id = $1
ORDER BY
    created_at DESC;

-- name: UpsertShiftTeamAttributes :many
INSERT INTO
    shift_team_attributes (shift_team_snapshot_id, attribute_id)
SELECT
    unnest(sqlc.arg(shift_team_snapshot_ids) :: BIGINT [ ]) AS shift_team_snapshot_id,
    unnest(sqlc.arg(attribute_ids) :: BIGINT [ ]) AS attribute_id ON CONFLICT ON CONSTRAINT shift_team_attributes_unique_shift_attribute DO NOTHING RETURNING *;

-- name: GetAttributesForShiftTeam :many
SELECT
    *
FROM
    shift_team_attributes
    JOIN attributes ON attributes.id = shift_team_attributes.attribute_id
WHERE
    shift_team_snapshot_id = $1;

-- name: GetAttributesForShiftTeamSnapshots :many
SELECT
    shift_team_attributes.shift_team_snapshot_id,
    attributes.*
FROM
    shift_team_attributes
    JOIN attributes ON attributes.id = shift_team_attributes.attribute_id
    JOIN (
        SELECT
            unnest(sqlc.arg(shift_team_snapshot_ids) :: BIGINT [ ]) AS shift_team_snapshot_id
    ) shift_team_snapshot_ids ON shift_team_attributes.shift_team_snapshot_id = shift_team_snapshot_ids.shift_team_snapshot_id
ORDER BY
    shift_team_attributes.shift_team_snapshot_id,
    attributes.id;

-- name: UpsertVisitAttributes :many
INSERT INTO
    visit_attributes (
        visit_snapshot_id,
        attribute_id,
        is_required,
        is_forbidden,
        is_preferred,
        is_unwanted
    )
SELECT
    unnest(sqlc.arg(visit_snapshot_ids) :: BIGINT [ ]) AS visit_snapshot_id,
    unnest(sqlc.arg(attribute_ids) :: BIGINT [ ]) AS attribute_id,
    unnest(sqlc.arg(is_requireds) :: BOOL [ ]) AS is_required,
    unnest(sqlc.arg(is_forbiddens) :: BOOL [ ]) AS is_forbidden,
    unnest(sqlc.arg(is_preferreds) :: BOOL [ ]) AS is_preferred,
    unnest(sqlc.arg(is_unwanteds) :: BOOL [ ]) AS is_unwanted ON CONFLICT ON CONSTRAINT visit_attributes_unique_visit_attribute DO NOTHING RETURNING *;

-- name: GetAttributesForVisit :many
SELECT
    *
FROM
    visit_attributes
    JOIN attributes ON attributes.id = visit_attributes.attribute_id
WHERE
    visit_snapshot_id = $1;

-- name: GetAttributesForVisitSnapshots :many
SELECT
    visit_attributes.visit_snapshot_id,
    visit_attributes.is_required,
    visit_attributes.is_forbidden,
    visit_attributes.is_preferred,
    visit_attributes.is_unwanted,
    attributes.*
FROM
    visit_attributes
    JOIN attributes ON attributes.id = visit_attributes.attribute_id
    JOIN (
        SELECT
            unnest(sqlc.arg(visit_snapshot_ids) :: BIGINT [ ]) AS visit_snapshot_id
    ) visit_snapshot_ids ON visit_attributes.visit_snapshot_id = visit_snapshot_ids.visit_snapshot_id
ORDER BY
    visit_attributes.visit_snapshot_id,
    attributes.id;

-- name: GetShiftTeamRestBreakRequestsForShiftTeams :many
SELECT
    shift_team_rest_break_requests.*
FROM
    shift_team_rest_break_requests
    JOIN (
        SELECT
            unnest(sqlc.arg(shift_team_ids) :: BIGINT [ ]) AS shift_team_id
    ) shift_team_ids ON shift_team_rest_break_requests.shift_team_id = shift_team_ids.shift_team_id
WHERE
    shift_team_rest_break_requests.created_at <= sqlc.arg(created_before);

-- name: GetShiftTeamSnapshotsInRegion :many
SELECT
    *
FROM
    shift_team_snapshots
WHERE
    service_region_id = $1
    AND start_timestamp_sec >= $2
    AND end_timestamp_sec < $3;

-- name: GetLatestShiftTeamSnapshot :one
SELECT
    *
FROM
    shift_team_snapshots
WHERE
    shift_team_id = $1
    AND created_at <= $2
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetVisitSnapshotsInRegion :many
SELECT
    *
FROM
    visit_snapshots
WHERE
    service_region_id = $1
    AND arrival_start_timestamp_sec >= $2
    AND arrival_end_timestamp_sec < $3;

-- name: DeleteVisitSnapshotForCareRequestID :one
INSERT INTO
    visit_snapshots (
        care_request_id,
        service_region_id,
        location_id,
        arrival_start_timestamp_sec,
        arrival_end_timestamp_sec,
        is_manual_override,
        service_duration_sec,
        deleted_at
    )
SELECT
    care_request_id,
    service_region_id,
    location_id,
    arrival_start_timestamp_sec,
    arrival_end_timestamp_sec,
    is_manual_override,
    service_duration_sec,
    CURRENT_TIMESTAMP
FROM
    visit_snapshots
WHERE
    visit_snapshots.care_request_id = $1
ORDER BY
    created_at DESC
LIMIT
    1 RETURNING *;

-- name: GetLatestVisitSnapshot :one
SELECT
    *
FROM
    visit_snapshots
WHERE
    care_request_id = $1
    AND created_at <= $2
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetLatestShiftTeamLocation :one
SELECT
    *
FROM
    shift_team_locations
WHERE
    shift_team_snapshot_id = $1
    AND created_at <= $2
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetLatestShiftTeamSnapshotsInRegion :many
WITH shift_team_ids AS MATERIALIZED (
    SELECT
        shift_team_id
    FROM
        shift_team_snapshots
    WHERE
        shift_team_snapshots.service_region_id = $1
        AND sqlc.arg(start_timestamp_sec) <= shift_team_snapshots.end_timestamp_sec
        AND sqlc.arg(end_timestamp_sec) >= shift_team_snapshots.start_timestamp_sec
        AND shift_team_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
        AND shift_team_snapshots.created_at >= sqlc.arg(since_snapshot_time)
    GROUP BY
        shift_team_id
),
ranked_shift_team_snapshot_ids AS (
    SELECT
        shift_team_snapshots.id,
        rank () OVER (
            PARTITION BY shift_team_snapshots.shift_team_id
            ORDER BY
                shift_team_snapshots.created_at DESC
        ) rank_number
    FROM
        shift_team_snapshots
        JOIN shift_team_ids ON shift_team_ids.shift_team_id = shift_team_snapshots.shift_team_id
    WHERE
        shift_team_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
)
SELECT
    shift_team_snapshots.*
FROM
    ranked_shift_team_snapshot_ids
    JOIN shift_team_snapshots ON ranked_shift_team_snapshot_ids.id = shift_team_snapshots.id
WHERE
    rank_number = 1
    AND shift_team_snapshots.service_region_id = $1
    AND sqlc.arg(start_timestamp_sec) <= shift_team_snapshots.end_timestamp_sec
    AND sqlc.arg(end_timestamp_sec) >= shift_team_snapshots.start_timestamp_sec
    AND deleted_at IS NULL;

-- name: GetLatestVisitSnapshotsInRegion :many
WITH care_request_ids AS MATERIALIZED (
    SELECT
        DISTINCT ON (care_request_id) care_request_id
    FROM
        visit_snapshots
    WHERE
        visit_snapshots.service_region_id = $1
        AND sqlc.arg(start_timestamp_sec) <= visit_snapshots.arrival_end_timestamp_sec
        AND sqlc.arg(end_timestamp_sec) >= visit_snapshots.arrival_start_timestamp_sec
        AND visit_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
        AND visit_snapshots.created_at >= sqlc.arg(since_snapshot_time)
    ORDER BY
        care_request_id
),
ranked_visit_snapshot_ids AS (
    SELECT
        visit_snapshots.id,
        rank () OVER (
            PARTITION BY visit_snapshots.care_request_id
            ORDER BY
                visit_snapshots.created_at DESC
        ) rank_number
    FROM
        visit_snapshots
        JOIN care_request_ids ON care_request_ids.care_request_id = visit_snapshots.care_request_id
    WHERE
        visit_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
),
latest_urgency_levels AS (
    SELECT
        DISTINCT ON(clinical_urgency_level_id) clinical_urgency_level_id,
        clinical_urgency_level_configs.clinical_window_duration_sec,
        clinical_urgency_level_configs.optimizer_urgency_level
    FROM
        clinical_urgency_level_configs
    WHERE
        clinical_urgency_level_configs.created_at <= sqlc.arg(latest_snapshot_time)
    ORDER BY
        clinical_urgency_level_id,
        clinical_urgency_level_configs.created_at DESC
)
SELECT
    visit_snapshots.*,
    latest_urgency_levels.clinical_urgency_level_id,
    latest_urgency_levels.clinical_window_duration_sec,
    latest_urgency_levels.optimizer_urgency_level,
    visit_value_snapshots.completion_value_cents,
    visit_value_snapshots.partner_priority_score,
    visit_value_snapshots.partner_influenced_completion_value_cents,
    CASE
        WHEN visit_priority_snapshots.id IS NULL THEN FALSE
        ELSE TRUE
    END AS is_prioritized,
    visit_phase_types.short_name AS visit_phase_type_short_name
FROM
    ranked_visit_snapshot_ids
    JOIN visit_snapshots ON ranked_visit_snapshot_ids.id = visit_snapshots.id
    JOIN visit_phase_snapshots ON visit_snapshots.id = visit_phase_snapshots.visit_snapshot_id
    JOIN visit_phase_types ON visit_phase_snapshots.visit_phase_type_id = visit_phase_types.id
    LEFT JOIN visit_acuity_snapshots ON visit_snapshots.id = visit_acuity_snapshots.visit_snapshot_id
    LEFT JOIN visit_value_snapshots ON visit_snapshots.id = visit_value_snapshots.visit_snapshot_id
    LEFT JOIN latest_urgency_levels ON visit_acuity_snapshots.clinical_urgency_level_id = latest_urgency_levels.clinical_urgency_level_id
    LEFT JOIN visit_priority_snapshots ON visit_snapshots.id = visit_priority_snapshots.visit_snapshot_id
WHERE
    ranked_visit_snapshot_ids.rank_number = 1
    AND visit_snapshots.service_region_id = $1
    AND visit_phase_types.short_name NOT IN ('requested', 'cancelled')
    AND sqlc.arg(start_timestamp_sec) <= visit_snapshots.arrival_end_timestamp_sec
    AND sqlc.arg(end_timestamp_sec) >= visit_snapshots.arrival_start_timestamp_sec
    AND deleted_at IS NULL;

-- name: BatchGetLatestVisitSnapshotsInRegion :batchmany
-- This query should return the same results as GetLatestVisitSnapshotsInRegion, please keep in sync.
WITH care_request_ids AS MATERIALIZED (
    SELECT
        DISTINCT ON (care_request_id) care_request_id
    FROM
        visit_snapshots
    WHERE
        visit_snapshots.service_region_id = sqlc.arg(service_region_id)
        AND sqlc.arg(start_timestamp_sec) <= visit_snapshots.arrival_end_timestamp_sec
        AND sqlc.arg(end_timestamp_sec) >= visit_snapshots.arrival_start_timestamp_sec
        AND visit_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
        AND visit_snapshots.created_at >= sqlc.arg(since_snapshot_time)
    ORDER BY
        care_request_id
),
ranked_visit_snapshot_ids AS (
    SELECT
        visit_snapshots.id,
        rank () OVER (
            PARTITION BY visit_snapshots.care_request_id
            ORDER BY
                visit_snapshots.created_at DESC
        ) rank_number
    FROM
        visit_snapshots
        JOIN care_request_ids ON care_request_ids.care_request_id = visit_snapshots.care_request_id
    WHERE
        visit_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
)
SELECT
    visit_snapshots.*,
    virtual_app_visit_phase_types.short_name AS virtual_app_visit_phase_type,
    visit_phase_types.short_name AS visit_phase_type
FROM
    ranked_visit_snapshot_ids
    JOIN visit_snapshots ON ranked_visit_snapshot_ids.id = visit_snapshots.id
    JOIN visit_phase_snapshots ON visit_snapshots.id = visit_phase_snapshots.visit_snapshot_id
    JOIN visit_phase_types ON visit_phase_snapshots.visit_phase_type_id = visit_phase_types.id
    LEFT JOIN virtual_app_visit_phase_snapshots ON visit_snapshots.id = virtual_app_visit_phase_snapshots.visit_snapshot_id
    LEFT JOIN virtual_app_visit_phase_types ON virtual_app_visit_phase_snapshots.virtual_app_visit_phase_type_id = virtual_app_visit_phase_types.id
WHERE
    ranked_visit_snapshot_ids.rank_number = 1
    AND visit_snapshots.service_region_id = sqlc.arg(service_region_id)
    AND visit_phase_types.id = ANY(sqlc.arg(visit_phase_types) :: BIGINT [ ])
    AND virtual_app_visit_phase_types.id = ANY(
        sqlc.arg(virtual_app_visit_phase_types) :: BIGINT [ ]
    )
    AND sqlc.arg(start_timestamp_sec) <= visit_snapshots.arrival_end_timestamp_sec
    AND sqlc.arg(end_timestamp_sec) >= visit_snapshots.arrival_start_timestamp_sec
    AND deleted_at IS NULL;

-- name: HasAnyShiftTeamSnapshotsInRegionSince :many
WITH in_schedule_shift_teams AS (
    SELECT
        shift_team_id
    FROM
        shift_team_snapshots
    WHERE
        shift_team_snapshots.service_region_id = $1
        AND sqlc.arg(start_timestamp_sec) <= shift_team_snapshots.end_timestamp_sec
        AND sqlc.arg(end_timestamp_sec) >= shift_team_snapshots.start_timestamp_sec
        AND shift_team_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
)
SELECT
    1
FROM
    shift_team_snapshots
    JOIN in_schedule_shift_teams ON shift_team_snapshots.shift_team_id = in_schedule_shift_teams.shift_team_id
WHERE
    shift_team_snapshots.created_at > sqlc.arg(since_snapshot_time)
    AND shift_team_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
LIMIT
    1;

-- name: GetShiftTeamsIDsInRegionSince :batchmany
SELECT
    DISTINCT shift_team_id
FROM
    shift_team_snapshots
WHERE
    shift_team_snapshots.service_region_id = sqlc.arg(service_region_id)
    AND sqlc.arg(start_timestamp_sec) <= shift_team_snapshots.end_timestamp_sec
    AND sqlc.arg(end_timestamp_sec) >= shift_team_snapshots.start_timestamp_sec
    AND shift_team_snapshots.created_at > sqlc.arg(since_snapshot_time)
    AND shift_team_snapshots.created_at <= sqlc.arg(latest_snapshot_time);

-- name: HasAnyVisitSnapshotsInRegionSince :many
WITH in_schedule_visits AS (
    SELECT
        care_request_id
    FROM
        visit_snapshots
    WHERE
        visit_snapshots.service_region_id = $1
        AND sqlc.arg(start_timestamp_sec) <= visit_snapshots.arrival_end_timestamp_sec
        AND sqlc.arg(end_timestamp_sec) >= visit_snapshots.arrival_start_timestamp_sec
        AND visit_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
)
SELECT
    1
FROM
    visit_snapshots
    JOIN in_schedule_visits ON visit_snapshots.care_request_id = in_schedule_visits.care_request_id
WHERE
    visit_snapshots.created_at > sqlc.arg(since_snapshot_time)
    AND visit_snapshots.created_at <= sqlc.arg(latest_snapshot_time)
LIMIT
    1;

-- name: GetCareRequestIDsSince :batchmany
SELECT
    DISTINCT care_request_id
FROM
    visit_snapshots
WHERE
    visit_snapshots.service_region_id = sqlc.arg(service_region_id)
    AND sqlc.arg(start_timestamp_sec) <= visit_snapshots.arrival_end_timestamp_sec
    AND sqlc.arg(end_timestamp_sec) >= visit_snapshots.arrival_start_timestamp_sec
    AND visit_snapshots.created_at > sqlc.arg(since_snapshot_time)
    AND visit_snapshots.created_at <= sqlc.arg(latest_snapshot_time);

-- name: GetCareRequestIDsForSchedule :many
WITH in_schedule_visits AS (
    SELECT
        care_request_id
    FROM
        schedule_visits
        JOIN visit_snapshots ON visit_snapshots.id = schedule_visits.visit_snapshot_id
    WHERE
        schedule_visits.schedule_id = sqlc.arg(schedule_id)
),
in_unassigned_schedule_visits AS (
    SELECT
        care_request_id
    FROM
        unassigned_schedule_visits
        JOIN visit_snapshots ON visit_snapshots.id = unassigned_schedule_visits.visit_snapshot_id
    WHERE
        unassigned_schedule_visits.schedule_id = sqlc.arg(schedule_id)
)
SELECT
    care_request_id
FROM
    in_schedule_visits
UNION ALL
(
    SELECT
        care_request_id
    FROM
        in_unassigned_schedule_visits
);

-- name: HasAnyNewShiftTeamRestBreakRequestsForShiftTeamsInRegionSince :many
SELECT
    1
FROM
    shift_team_rest_break_requests
    JOIN shift_team_snapshots ON shift_team_snapshots.shift_team_id = shift_team_rest_break_requests.shift_team_id
WHERE
    shift_team_snapshots.service_region_id = $1
    AND sqlc.arg(start_timestamp_sec) <= shift_team_snapshots.end_timestamp_sec
    AND sqlc.arg(end_timestamp_sec) >= shift_team_snapshots.start_timestamp_sec
    AND shift_team_rest_break_requests.created_at > sqlc.arg(since_snapshot_time)
    AND shift_team_rest_break_requests.created_at <= sqlc.arg(latest_snapshot_time)
LIMIT
    1;

-- name: AddShiftTeamRestBreakRequest :one
INSERT INTO
    shift_team_rest_break_requests(
        shift_team_id,
        start_timestamp_sec,
        duration_sec,
        location_id
    )
SELECT
    $1,
    $2,
    $3,
    $4
WHERE
    (
        SELECT
            count(*)
        FROM
            shift_team_rest_break_requests
        WHERE
            shift_team_rest_break_requests.shift_team_id = $1
    ) < sqlc.arg(max_rest_break_requests) RETURNING *;

-- name: AddShiftTeamLocation :one
INSERT INTO
    shift_team_locations(shift_team_snapshot_id, location_id)
VALUES
    ($1, $2) RETURNING *;

-- name: AddShiftTeamLocations :many
INSERT INTO
    shift_team_locations(shift_team_snapshot_id, location_id)
SELECT
    unnest(sqlc.arg(shift_team_snapshot_ids) :: BIGINT [ ]) AS shift_team_snapshot_id,
    unnest(sqlc.arg(location_ids) :: BIGINT [ ]) AS location_id RETURNING *;

-- name: AddOptimizerRun :one
INSERT INTO
    optimizer_runs (
        service_region_id,
        service_date,
        open_hours_schedule_day_id,
        open_hours_start_timestamp_sec,
        open_hours_end_timestamp_sec,
        earliest_distance_timestamp,
        latest_distance_timestamp,
        snapshot_timestamp,
        service_version,
        optimizer_config_id,
        distance_source_id,
        optimizer_constraint_config_id,
        optimizer_settings_id,
        optimizer_run_type_id
    )
VALUES
    (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        (
            SELECT
                id
            FROM
                optimizer_run_types
            WHERE
                name = sqlc.arg(optimizer_run_type)
        )
    ) RETURNING *;

-- name: GetOptimizerRun :one
SELECT
    *
FROM
    optimizer_runs
WHERE
    id = $1
LIMIT
    1;

-- name: AddOptimizerRunError :one
INSERT INTO
    optimizer_run_errors (
        optimizer_run_id,
        error_value,
        optimizer_run_error_source_id
    )
VALUES
    ($1, $2, $3) RETURNING *;

-- name: GetOptimizerRunErrorForOptimizerRunID :one
SELECT
    *
FROM
    optimizer_run_errors
WHERE
    optimizer_run_id = $1
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetLatestScheduleForOptimizerRunID :one
SELECT
    schedules.*,
    optimizer_runs.service_version AS logistics_version
FROM
    schedules
    JOIN optimizer_runs ON schedules.optimizer_run_id = optimizer_runs.id
WHERE
    optimizer_run_id = $1
ORDER BY
    schedules.created_at DESC
LIMIT
    1;

-- name: GetScheduleForID :one
SELECT
    schedules.*,
    optimizer_runs.service_version AS logistics_version
FROM
    schedules
    JOIN optimizer_runs ON schedules.optimizer_run_id = optimizer_runs.id
WHERE
    schedules.id = $1
ORDER BY
    schedules.created_at DESC
LIMIT
    1;

-- name: GetLatestOptimizerRunForRegionDate :one
SELECT
    optimizer_runs.*
FROM
    optimizer_runs
    JOIN optimizer_run_types ON optimizer_run_types.id = optimizer_runs.optimizer_run_type_id
WHERE
    service_region_id = $1
    AND service_date = $2
    AND created_at <= sqlc.arg(created_before)
    AND optimizer_run_types.name = 'service_region_schedule'
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetLatestOptimizerRunWithScheduleForRegionDate :one
SELECT
    optimizer_runs.id optimizer_run_id,
    schedules.id schedule_id
FROM
    optimizer_runs
    JOIN optimizer_run_types ON optimizer_run_types.id = optimizer_runs.optimizer_run_type_id
    JOIN schedules ON schedules.optimizer_run_id = optimizer_runs.id
WHERE
    optimizer_runs.service_region_id = $1
    AND optimizer_runs.service_date = $2
    AND optimizer_runs.created_at <= sqlc.arg(created_before)
    AND optimizer_run_types.name = 'service_region_schedule'
ORDER BY
    optimizer_runs.created_at DESC,
    schedules.created_at DESC
LIMIT
    1;

-- name: BatchGetLatestServiceRegionAvailabilityOptimizerRunWithSchedule :batchone
SELECT
    optimizer_runs.id optimizer_run_id,
    schedules.id schedule_id
FROM
    optimizer_runs
    JOIN optimizer_run_types ON optimizer_run_types.id = optimizer_runs.optimizer_run_type_id
    JOIN schedules ON schedules.optimizer_run_id = optimizer_runs.id
WHERE
    optimizer_runs.service_region_id = sqlc.arg(service_region_id)
    AND optimizer_runs.service_date = sqlc.arg(service_date)
    AND optimizer_runs.created_at <= sqlc.arg(created_before)
    AND optimizer_run_types.name = 'service_region_availability'
ORDER BY
    optimizer_runs.created_at DESC,
    schedules.created_at DESC
LIMIT
    1;

-- name: GetOptimizerConfigsByIDs :many
SELECT
    optimizer_configs.*
FROM
    optimizer_configs
    JOIN (
        SELECT
            unnest(sqlc.arg(optimizer_config_ids) :: BIGINT [ ]) AS optimizer_config_id
    ) optimizer_config_ids ON optimizer_config_ids.optimizer_config_id = optimizer_configs.id;

-- name: GetLatestCareRequestsDataForDiagnostics :many
WITH ranked_visit_snapshots AS (
    SELECT
        visit_snapshots.care_request_id,
        visit_snapshots.id AS visit_snapshot_id,
        visit_snapshots.arrival_start_timestamp_sec,
        visit_snapshots.arrival_end_timestamp_sec,
        visit_snapshots.service_duration_sec,
        visit_snapshots.is_manual_override,
        visit_snapshots.location_id,
        rank () OVER (
            PARTITION BY visit_snapshots.care_request_id
            ORDER BY
                visit_snapshots.created_at DESC
        ) AS rank
    FROM
        visit_snapshots
        JOIN (
            SELECT
                unnest(sqlc.arg(care_request_ids) :: BIGINT [ ]) AS care_request_id_input
        ) AS care_requests_ids ON care_requests_ids.care_request_id_input = visit_snapshots.care_request_id
    WHERE
        visit_snapshots.created_at <= sqlc.arg(created_before)
)
SELECT
    ranked_visit_snapshots.care_request_id,
    ranked_visit_snapshots.visit_snapshot_id,
    ranked_visit_snapshots.arrival_start_timestamp_sec,
    ranked_visit_snapshots.arrival_end_timestamp_sec,
    ranked_visit_snapshots.service_duration_sec,
    ranked_visit_snapshots.is_manual_override,
    ranked_visit_snapshots.location_id,
    visit_phase_snapshots.shift_team_id,
    visit_phase_types.short_name AS visit_phase_short_name
FROM
    ranked_visit_snapshots
    JOIN visit_phase_snapshots ON visit_phase_snapshots.visit_snapshot_id = ranked_visit_snapshots.visit_snapshot_id
    JOIN visit_phase_types ON visit_phase_types.id = visit_phase_snapshots.visit_phase_type_id
WHERE
    rank = 1;

-- name: AddCheckFeasibilityQuery :one
INSERT INTO
    check_feasibility_queries (
        care_request_id,
        service_region_id,
        optimizer_run_id,
        best_schedule_id,
        best_schedule_is_feasible,
        location_id,
        service_date,
        arrival_time_window_start_timestamp_sec,
        arrival_time_window_end_timestamp_sec,
        service_duration_sec,
        response_status
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;

-- name: GetLatestCheckFeasibilityQueryForCareRequest :one
SELECT
    *
FROM
    check_feasibility_queries
WHERE
    care_request_id = $1
    AND created_at <= sqlc.arg(created_before)
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetAllCheckFeasibilityQueriesForCareRequest :many
SELECT
    *
FROM
    check_feasibility_queries
WHERE
    care_request_id = $1
ORDER BY
    created_at DESC;

-- name: AddCheckFeasibilityQueryAttributes :many
INSERT INTO
    check_feasibility_query_attributes (
        check_feasibility_query_id,
        attribute_id,
        is_required,
        is_forbidden,
        is_preferred,
        is_unwanted
    )
SELECT
    unnest(sqlc.arg(check_feasibility_query_ids) :: BIGINT [ ]) AS check_feasibility_query_id,
    unnest(sqlc.arg(attribute_ids) :: BIGINT [ ]) AS attribute_id,
    unnest(sqlc.arg(is_requireds) :: BOOL [ ]) AS is_required,
    unnest(sqlc.arg(is_forbiddens) :: BOOL [ ]) AS is_forbidden,
    unnest(sqlc.arg(is_preferreds) :: BOOL [ ]) AS is_preferred,
    unnest(sqlc.arg(is_unwanteds) :: BOOL [ ]) AS is_unwanted RETURNING *;

-- name: GetAttributesForCheckFeasibilityQuery :many
SELECT
    *
FROM
    check_feasibility_query_attributes
    JOIN attributes ON attributes.id = check_feasibility_query_attributes.attribute_id
WHERE
    check_feasibility_query_id = $1;

-- name: AddServiceRegionAvailabilityQuery :one
INSERT INTO
    service_region_availability_queries (
        service_region_id,
        service_date,
        reference_schedule_id,
        feasibility_status
    )
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: AddServiceRegionAvailabilityQueries :many
INSERT INTO
    service_region_availability_queries (
        service_region_id,
        service_date,
        reference_schedule_id,
        feasibility_status
    )
SELECT
    unnest(sqlc.arg(service_region_ids) :: BIGINT [ ]) AS service_region_ids,
    unnest(sqlc.arg(service_dates) :: DATE [ ]) AS service_dates,
    unnest(sqlc.arg(reference_schedule_ids) :: BIGINT [ ]) AS reference_schedule_ids,
    unnest(sqlc.arg(feasibility_statuses) :: TEXT [ ]) AS feasibility_statuses RETURNING *;

-- name: AddServiceRegionAvailabilityQueryAttributes :many
INSERT INTO
    service_region_availability_query_attributes (
        service_region_availability_query_id,
        attribute_id
    )
SELECT
    unnest (
        sqlc.arg(service_region_availability_query_ids) :: BIGINT [ ]
    ) AS service_region_availability_query_id,
    unnest(sqlc.arg(attribute_ids) :: BIGINT [ ]) AS attribute_id RETURNING *;

-- name: GetLatestServiceRegionAvailabilityQuery :one
SELECT
    *
FROM
    service_region_availability_queries
WHERE
    service_region_id = $1
    AND service_date = $2
    AND created_at <= sqlc.arg(created_before)
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetConstraintConfig :one
SELECT
    *
FROM
    optimizer_constraint_configs
WHERE
    id = $1;

-- name: GetConstraintConfigByValue :one
SELECT
    *
FROM
    optimizer_constraint_configs
WHERE
    config = $1;

-- name: UpsertConstraintConfig :many
INSERT INTO
    optimizer_constraint_configs(config)
VALUES
    ($1) ON CONFLICT ON CONSTRAINT optimizer_constraint_configs_unique_configs DO NOTHING RETURNING *;

-- name: GetOptimizerSettingsByID :one
SELECT
    *
FROM
    optimizer_settings
WHERE
    id = $1;

-- name: GetOptimizerSettingsByValue :one
SELECT
    *
FROM
    optimizer_settings
WHERE
    settings = $1;

-- name: UpsertOptimizerSettings :many
INSERT INTO
    optimizer_settings(settings)
VALUES
    ($1) ON CONFLICT ON CONSTRAINT optimizer_settings_unique_settings DO NOTHING RETURNING *;

-- name: GetOptimizerRunTypeByName :one
SELECT
    *
FROM
    optimizer_run_types
WHERE
    name = $1;
