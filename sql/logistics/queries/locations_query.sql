-- name: AddLocation :one
INSERT INTO
    locations (latitude_e6, longitude_e6)
VALUES
    ($1, $2) RETURNING *;

-- name: UpsertLocation :many
INSERT INTO
    locations (latitude_e6, longitude_e6)
VALUES
    ($1, $2) ON CONFLICT ON CONSTRAINT location_unique_lat_lng DO NOTHING RETURNING *;

-- name: UpsertLocations :many
-- https://github.com/kyleconroy/sqlc/issues/218#issuecomment-829263172
INSERT INTO
    locations (latitude_e6, longitude_e6)
SELECT
    unnest(sqlc.arg(lat_e6s) :: INTEGER [ ]) AS latitude_e6,
    unnest(sqlc.arg(lng_e6s) :: INTEGER [ ]) AS longitude_e6 ON CONFLICT ON CONSTRAINT location_unique_lat_lng DO NOTHING RETURNING *;

-- name: GetLocation :one
SELECT
    *
FROM
    locations
WHERE
    latitude_e6 = $1
    AND longitude_e6 = $2;

-- name: GetLocations :many
SELECT
    locations.*
FROM
    locations
    INNER JOIN (
        SELECT
            unnest(sqlc.arg(lat_e6s) :: INTEGER [ ]) AS latitude_e6,
            unnest(sqlc.arg(lng_e6s) :: INTEGER [ ]) AS longitude_e6
    ) latlngs ON locations.latitude_e6 = latlngs.latitude_e6
    AND locations.longitude_e6 = latlngs.longitude_e6;

-- name: AddDistance :one
INSERT INTO
    distances (
        from_location_id,
        to_location_id,
        distance_meters,
        duration_seconds,
        source_id
    )
VALUES
    ($1, $2, $3, $4, $5) RETURNING *;

-- name: AddDistanceWithCreatedAt :one
INSERT INTO
    distances (
        from_location_id,
        to_location_id,
        distance_meters,
        duration_seconds,
        source_id,
        created_at
    )
VALUES
    ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: AddDistances :many
INSERT INTO
    distances (
        from_location_id,
        to_location_id,
        distance_meters,
        duration_seconds,
        source_id
    )
SELECT
    unnest(sqlc.arg(from_location_ids) :: BIGINT [ ]) AS from_location_id,
    unnest(sqlc.arg(to_location_ids) :: BIGINT [ ]) AS to_location_id,
    unnest(sqlc.arg(distances_meters) :: INTEGER [ ]) AS distance_meters,
    unnest(sqlc.arg(durations_seconds) :: INTEGER [ ]) AS duration_seconds,
    unnest(sqlc.arg(source_ids) :: BIGINT [ ]) AS source_id RETURNING *;

-- name: GetDistanceSource :one
SELECT
    *
FROM
    distance_sources
WHERE
    short_name = $1;

-- name: GetLatestDistanceForLocation :one
SELECT
    *
FROM
    distances
WHERE
    from_location_id = $1
    AND to_location_id = $2
    AND source_id = $3
    AND created_at >= $4
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetLatestDistancesForLocations :many
SELECT
    DISTINCT ON (
        distances.from_location_id,
        distances.to_location_id,
        distances.source_id
    ) *
FROM
    distances
    INNER JOIN (
        SELECT
            unnest(sqlc.arg(from_location_ids) :: BIGINT [ ]) AS from_location_id,
            unnest(sqlc.arg(to_location_ids) :: BIGINT [ ]) AS to_location_id,
            unnest(sqlc.arg(source_ids) :: BIGINT [ ]) AS source_id
    ) from_to_locs ON distances.from_location_id = from_to_locs.from_location_id
    AND distances.to_location_id = from_to_locs.to_location_id
    AND distances.source_id = from_to_locs.source_id
WHERE
    distances.created_at >= $1
ORDER BY
    distances.from_location_id,
    distances.to_location_id,
    distances.source_id,
    distances.created_at DESC,
    distances.id DESC;

-- name: BatchGetLatestDistancesForLocations :batchmany
-- This query should return the same results as GetLatestDistancesForLocations, keep in sync
SELECT
    DISTINCT ON (
        distances.from_location_id,
        distances.to_location_id,
        distances.source_id
    ) *
FROM
    distances
    INNER JOIN (
        SELECT
            unnest(sqlc.arg(from_location_ids) :: BIGINT [ ]) AS from_location_id,
            unnest(sqlc.arg(to_location_ids) :: BIGINT [ ]) AS to_location_id,
            unnest(sqlc.arg(source_ids) :: BIGINT [ ]) AS source_id
    ) from_to_locs ON distances.from_location_id = from_to_locs.from_location_id
    AND distances.to_location_id = from_to_locs.to_location_id
    AND distances.source_id = from_to_locs.source_id
WHERE
    distances.created_at >= sqlc.arg(after_created_at)
ORDER BY
    distances.from_location_id,
    distances.to_location_id,
    distances.source_id,
    distances.created_at DESC,
    distances.id DESC;

-- name: GetLocationsByIDs :many
SELECT
    locations.*
FROM
    locations
    JOIN (
        SELECT
            unnest(sqlc.arg(ids) :: BIGINT [ ]) AS id
    ) location_ids ON locations.id = location_ids.id
ORDER BY
    locations.id;
