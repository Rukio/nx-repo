-- name: GetVisitByCareRequestId :one
SELECT
    *
FROM
    visits
WHERE
    care_request_id = sqlc.arg(care_request_id) :: BIGINT;

-- name: GetVisitsByCareRequestIDs :many
SELECT
    *
FROM
    visits
WHERE
    care_request_id IN(
        SELECT
            unnest(sqlc.arg(care_request_ids) :: BIGINT [ ])
    );

-- name: CreateVisit :one
INSERT INTO
    visits (
        care_request_id,
        episode_id,
        visit_type_id,
        created_by_user_id,
        updated_by_user_id,
        "status",
        status_updated_at,
        address_id,
        patient_availability_start,
        patient_availability_end,
        car_name,
        provider_user_ids,
        virtual_app_id,
        car_id
    )
VALUES
    ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *;

-- name: UpdateVisitByCareRequestID :one
UPDATE
    visits
SET
    status = COALESCE(sqlc.narg(status), status),
    status_updated_at = COALESCE(sqlc.narg(status_updated_at), status_updated_at),
    patient_availability_start = sqlc.narg(patient_availability_start),
    patient_availability_end = sqlc.narg(patient_availability_end),
    car_name = sqlc.narg(car_name),
    car_id = sqlc.narg(car_id),
    virtual_app_id = sqlc.narg(virtual_app_id),
    provider_user_ids = sqlc.narg(provider_user_ids),
    address_id = COALESCE(sqlc.narg(address_id), address_id),
    updated_by_user_id = COALESCE(sqlc.narg(updated_by_user_id), updated_by_user_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    care_request_id = sqlc.arg(care_request_id) :: BIGINT RETURNING *;

-- name: GetVisit :one
SELECT
    *
FROM
    visits
WHERE
    id = sqlc.arg(id);

-- name: GetVisitWithDetails :one
SELECT
    visits.id,
    visits.episode_id,
    visit_types.name AS "type",
    visits.created_at,
    visits.updated_at,
    visits.status,
    visits.car_name,
    visits.car_id,
    visits.virtual_app_id,
    visits.provider_user_ids,
    visits.created_by_user_id,
    visits.updated_by_user_id,
    visits.address_id,
    visits.patient_availability_start,
    visits.patient_availability_end,
    visit_summaries.body AS summary_body,
    visit_summaries.created_at AS summary_created_at,
    visit_summaries.updated_at AS summary_updated_at,
    visit_summaries.created_by_user_id AS summary_created_by_user_id,
    visit_summaries.updated_by_user_id AS summary_updated_by_user_id
FROM
    visits
    LEFT JOIN visit_types ON visits.visit_type_id = visit_types.id
    LEFT JOIN visit_summaries ON visits.id = visit_summaries.visit_id
WHERE
    visits.id = sqlc.arg(id);

-- name: GetEpisodeVisits :many
SELECT
    visits.id,
    visits.episode_id,
    visits.created_at,
    visits.updated_at,
    visits.status,
    visits.car_name,
    visits.provider_user_ids,
    visit_types.name AS "type",
    visit_types.id AS "type_id",
    summaries.body AS summary,
    visits.care_request_id,
    visits.created_by_user_id,
    visits.patient_availability_start,
    visits.patient_availability_end,
    visits.status_updated_at
FROM
    visits
    LEFT JOIN visit_types ON visit_types.id = visits.visit_type_id
    LEFT JOIN visit_summaries AS summaries ON summaries.visit_id = visits.id
WHERE
    visits.episode_id = sqlc.arg(episode_id)
ORDER BY
    visits.created_at DESC;

-- name: UpdateVisitStatusAndProviders :one
UPDATE
    visits
SET
    status = sqlc.arg(status),
    provider_user_ids = COALESCE(sqlc.narg(provider_user_ids), provider_user_ids),
    updated_by_user_id = sqlc.arg(updated_by_user_id),
    updated_at = NOW()
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: UpdateVisit :one
UPDATE
    visits
SET
    status = COALESCE(sqlc.narg(status), status),
    status_updated_at = COALESCE(sqlc.narg(status_updated_at), status_updated_at),
    patient_availability_start = COALESCE(
        sqlc.narg(patient_availability_start),
        patient_availability_start
    ),
    patient_availability_end = COALESCE(
        sqlc.narg(patient_availability_end),
        patient_availability_end
    ),
    visit_type_id = COALESCE(sqlc.narg(visit_type_id), visit_type_id),
    car_name = COALESCE(sqlc.narg(car_name), car_name),
    car_id = COALESCE(sqlc.narg(car_id), car_id),
    virtual_app_id = COALESCE(sqlc.narg(virtual_app_id), virtual_app_id),
    provider_user_ids = COALESCE(sqlc.narg(provider_user_ids), provider_user_ids),
    address_id = COALESCE(sqlc.narg(address_id), address_id),
    updated_by_user_id = COALESCE(sqlc.narg(updated_by_user_id), updated_by_user_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: UpdateVisitEpisode :one
UPDATE
    visits
SET
    episode_id = sqlc.arg(episode_id)
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetEpisodeLatestVisitWithCareRequest :one
SELECT
    *
FROM
    visits
WHERE
    visits.episode_id = sqlc.arg(episode_id)
    AND visits.care_request_id IS NOT NULL
ORDER BY
    visits.created_at DESC
LIMIT
    1;
