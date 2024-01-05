-- name: AddServiceRegion :one
INSERT INTO
    service_regions (description, iana_time_zone_name)
VALUES
    ($1, $2) RETURNING *;

-- name: AddMarket :one
INSERT INTO
    markets (service_region_id, station_market_id, short_name)
VALUES
    ($1, $2, $3) RETURNING *;

-- name: GetMarketByID :one
SELECT
    *
FROM
    markets
WHERE
    id = $1;

-- name: GetMarketByStationMarketID :one
SELECT
    *
FROM
    markets
WHERE
    station_market_id = $1
ORDER BY
    created_at DESC
LIMIT
    1;

-- TODO: Remove this function until we need it.
-- name: GetMarketsInServiceRegion :many
SELECT
    *
FROM
    markets
WHERE
    service_region_id = $1
ORDER BY
    id;

-- name: GetServiceRegionForStationMarket :one
SELECT
    *
FROM
    service_regions
WHERE
    id = (
        SELECT
            service_region_id
        FROM
            markets
        WHERE
            markets.station_market_id = $1
        ORDER BY
            created_at DESC
        LIMIT
            1
    );

-- name: GetServiceRegionsForStationMarkets :many
SELECT
    DISTINCT ON (markets.station_market_id) markets.station_market_id,
    service_regions.*
FROM
    service_regions
    JOIN markets ON markets.service_region_id = service_regions.id
WHERE
    markets.station_market_id = ANY(sqlc.arg(station_market_ids) :: BIGINT [ ])
ORDER BY
    markets.station_market_id,
    markets.created_at DESC;

-- name: GetServiceRegionByID :one
SELECT
    *
FROM
    service_regions
WHERE
    id = $1;

-- name: AddServiceRegionOpenHoursSchedule :one
INSERT INTO
    service_region_open_hours_schedules(service_region_id)
VALUES
    ($1) RETURNING *;

-- name: AddServiceRegionOpenHoursScheduleDays :many
INSERT INTO
    service_region_open_hours_schedule_days(
        service_region_open_hours_schedule_id,
        day_of_week,
        start_time,
        end_time
    )
SELECT
    unnest(
        sqlc.arg(service_region_open_hours_schedule_ids) :: BIGINT [ ]
    ) AS service_region_open_hours_schedule_id,
    unnest(sqlc.arg(days_of_week) :: INT [ ]) AS day_of_week,
    unnest(
        sqlc.arg(start_times) :: TIMESTAMP WITHOUT TIME ZONE [ ]
    ) AS start_time,
    unnest(sqlc.arg(end_times) :: TIMESTAMP WITHOUT TIME ZONE [ ]) AS end_time RETURNING *;

-- name: GetLatestOpenHoursScheduleForServiceRegion :many
SELECT
    *
FROM
    service_region_open_hours_schedule_days
WHERE
    service_region_open_hours_schedule_id = (
        SELECT
            id
        FROM
            service_region_open_hours_schedules
        WHERE
            service_region_id = $1
            AND service_region_open_hours_schedules.created_at <= sqlc.arg(before_created_at)
        ORDER BY
            service_region_open_hours_schedules.created_at DESC
        LIMIT
            1
    )
ORDER BY
    day_of_week;

-- name: GetLatestOpenHoursScheduleForServiceRegionsForDay :many
SELECT
    service_region_open_hours_schedule_days.*,
    service_region_schedules.service_region_id,
    service_regions.iana_time_zone_name
FROM
    service_region_open_hours_schedule_days
    JOIN (
        SELECT
            DISTINCT ON (service_region_id) service_region_id,
            id
        FROM
            service_region_open_hours_schedules
        WHERE
            service_region_id = ANY(sqlc.arg(service_region_ids) :: BIGINT [ ])
            AND service_region_open_hours_schedules.created_at <= sqlc.arg(before_created_at)
        ORDER BY
            service_region_id,
            created_at DESC
    ) service_region_schedules ON service_region_schedules.id = service_region_open_hours_schedule_id
    JOIN service_regions ON service_region_schedules.service_region_id = service_regions.id
WHERE
    day_of_week = sqlc.arg(day_of_week);

-- name: GetIANATimeZoneNameForServiceRegion :one
SELECT
    iana_time_zone_name
FROM
    service_regions
WHERE
    id = $1;

-- name: AddServiceRegionMinimalVisitDuration :one
INSERT INTO
    service_region_minimal_visit_durations(service_region_id, service_duration_sec)
VALUES
    ($1, $2) RETURNING *;

-- name: AddServiceRegionCanonicalVisitDurations :one
INSERT INTO
    service_region_canonical_visit_durations(
        service_region_id,
        service_duration_min_sec,
        service_duration_max_sec
    )
VALUES
    ($1, $2, $3) RETURNING *;

-- name: GetServiceRegionMinimalVisitDuration :one
SELECT
    service_duration_sec
FROM
    service_region_minimal_visit_durations
WHERE
    service_region_id = $1
    AND created_at <= sqlc.arg(created_before)
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetServiceRegionCanonicalVisitDurations :one
SELECT
    *
FROM
    service_region_canonical_visit_durations
WHERE
    service_region_id = $1
    AND created_at <= sqlc.arg(created_before)
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: AddServiceRegionCanonicalLocationSet :one
INSERT INTO
    service_region_canonical_location_sets(service_region_id)
VALUES
    ($1) RETURNING *;

-- name: AddServiceRegionCanonicalLocations :many
INSERT INTO
    service_region_canonical_locations(
        location_id,
        service_region_canonical_location_set_id
    )
SELECT
    unnest(sqlc.arg(locations_ids) :: BIGINT [ ]) AS location_id,
    sqlc.arg(service_region_canonical_location_set_id) AS service_region_canonical_location_set_id RETURNING *;

-- name: GetServiceRegionCanonicalLocations :many
SELECT
    *
FROM
    service_region_canonical_locations
WHERE
    service_region_canonical_location_set_id = (
        SELECT
            id
        FROM
            service_region_canonical_location_sets
        WHERE
            service_region_id = $1
        ORDER BY
            created_at DESC
        LIMIT
            1
    );
