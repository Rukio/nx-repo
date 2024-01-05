-- name: AddServiceRegionAvailabilityVisits :many
INSERT INTO
    service_region_availability_visits (
        arrival_start_time,
        arrival_end_time,
        service_region_availability_visit_set_id,
        location_id,
        service_duration_sec
    )
SELECT
    unnest(sqlc.arg(arrival_start_times) :: TIME [ ]) AS arrival_start_times,
    unnest(sqlc.arg(arrival_end_times) :: TIME [ ]) AS arrival_end_times,
    unnest(
        sqlc.arg(service_region_availability_visit_set_ids) :: BIGINT [ ]
    ) AS service_region_availability_visit_set_id,
    unnest(sqlc.arg(location_ids) :: BIGINT [ ]) AS location_id,
    unnest(sqlc.arg(service_durations_sec) :: BIGINT [ ]) AS service_duration_sec RETURNING *;

-- name: AddServiceRegionAvailabilityVisitSet :one
INSERT INTO
    service_region_availability_visit_sets(service_region_id)
VALUES
    ($1) RETURNING *;

-- name: AddServiceRegionAvailabilityVisitAttributes :many
INSERT INTO
    service_region_availability_visit_attributes (
        service_region_availability_visit_id,
        attribute_id,
        is_required,
        is_forbidden,
        is_preferred,
        is_unwanted
    )
SELECT
    unnest (
        sqlc.arg(service_region_availability_visit_ids) :: BIGINT [ ]
    ) AS service_region_availability_visit_id,
    unnest(sqlc.arg(attribute_ids) :: BIGINT [ ]) AS attribute_id,
    unnest(sqlc.arg(is_requireds) :: BOOLEAN [ ]) AS is_required,
    unnest(sqlc.arg(is_forbiddens) :: BOOLEAN [ ]) AS is_forbidden,
    unnest(sqlc.arg(is_preferreds) :: BOOLEAN [ ]) AS is_preferred,
    unnest(sqlc.arg(is_unwanteds) :: BOOLEAN [ ]) AS is_unwanted RETURNING *;

-- name: GetLatestAvailabilityVisitsInRegion :many
SELECT
    service_region_availability_visits.*
FROM
    service_region_availability_visits
WHERE
    service_region_availability_visit_set_id = (
        SELECT
            id
        FROM
            service_region_availability_visit_sets
        WHERE
            service_region_id = sqlc.arg(service_region_id)
        ORDER BY
            created_at DESC
        LIMIT
            1
    );

-- name: GetServiceRegionAvailabilityVisitAttributes :many
WITH availability_visit_ids AS (
    SELECT
        unnest(sqlc.arg(availability_visit_ids) :: BIGINT [ ]) AS id
)
SELECT
    attributes.*,
    availability_visit_ids.id AS service_region_availability_visit_id
FROM
    service_region_availability_visit_attributes
    JOIN attributes ON service_region_availability_visit_attributes.attribute_id = attributes.id
    JOIN availability_visit_ids ON service_region_availability_visit_attributes.service_region_availability_visit_id = availability_visit_ids.id;

-- name: BatchGetServiceRegionAvailabilityVisitAttributes :batchmany
WITH availability_visit_ids AS (
    SELECT
        unnest(sqlc.arg(availability_visit_ids) :: BIGINT [ ]) AS id
)
SELECT
    attributes.*,
    availability_visit_ids.id AS service_region_availability_visit_id
FROM
    service_region_availability_visit_attributes
    JOIN attributes ON service_region_availability_visit_attributes.attribute_id = attributes.id
    JOIN availability_visit_ids ON service_region_availability_visit_attributes.service_region_availability_visit_id = availability_visit_ids.id;

-- name: GetAssignedAvailabilityVisitsForScheduleID :many
WITH availability_visit_ids AS (
    SELECT
        service_region_availability_visit_id AS id
    FROM
        schedule_visits
    WHERE
        schedule_id = $1
)
SELECT
    service_region_availability_visits.*
FROM
    service_region_availability_visits
    JOIN availability_visit_ids ON availability_visit_ids.id = service_region_availability_visits.id;

-- name: BatchGetAssignedAvailabilityVisitsForScheduleID :batchmany
WITH availability_visit_ids AS (
    SELECT
        service_region_availability_visit_id AS id
    FROM
        schedule_visits
    WHERE
        schedule_id = sqlc.arg(schedule_id)
)
SELECT
    service_region_availability_visits.*
FROM
    service_region_availability_visits
    JOIN availability_visit_ids ON availability_visit_ids.id = service_region_availability_visits.id;

-- name: GetUnassignedAvailabilityVisitsForScheduleID :many
WITH availability_visit_ids AS (
    SELECT
        service_region_availability_visit_id AS id
    FROM
        unassigned_schedule_visits
    WHERE
        schedule_id = $1
)
SELECT
    service_region_availability_visits.*
FROM
    service_region_availability_visits
    JOIN availability_visit_ids ON availability_visit_ids.id = service_region_availability_visits.id;

-- name: BatchGetUnassignedAvailabilityVisitsForScheduleID :batchmany
WITH availability_visit_ids AS (
    SELECT
        service_region_availability_visit_id AS id
    FROM
        unassigned_schedule_visits
    WHERE
        schedule_id = sqlc.arg(schedule_id)
)
SELECT
    service_region_availability_visits.*
FROM
    service_region_availability_visits
    JOIN availability_visit_ids ON availability_visit_ids.id = service_region_availability_visits.id;
