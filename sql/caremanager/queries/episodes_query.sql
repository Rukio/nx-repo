-- name: CreateEpisode :one
INSERT INTO
    episodes (
        care_day,
        admitted_at,
        discharged_at,
        source,
        patient_summary,
        primary_diagnosis,
        payer,
        doctors_primary_care,
        patient_id,
        service_line_id,
        care_phase_id,
        market_id,
        original_care_request_id
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *;

-- TODO(AC-1310): Replace offset-based pagination
-- name: GetEpisodes :many
WITH episodes_with_incomplete_tasks AS (
    SELECT
        DISTINCT ON (tasks.episode_id) tasks.episode_id AS id
    FROM
        tasks
    WHERE
        tasks.is_completed IS FALSE
        AND tasks.deleted_at IS NULL
)
SELECT
    episodes.*,
    COUNT(*) OVER()
FROM
    episodes
    LEFT JOIN episodes_with_incomplete_tasks ON episodes_with_incomplete_tasks.id = episodes.id
    INNER JOIN patients ON episodes.patient_id = patients.id
    INNER JOIN care_phases ON episodes.care_phase_id = care_phases.id
WHERE
    (
        patients.first_name ILIKE CONCAT('%', sqlc.narg(patient_name) :: TEXT, '%')
        OR patients.middle_name ILIKE CONCAT('%', sqlc.narg(patient_name) :: TEXT, '%')
        OR patients.last_name ILIKE CONCAT('%', sqlc.narg(patient_name) :: TEXT, '%')
    )
    AND episodes.market_id = ANY(sqlc.arg(market_ids) :: BIGINT [ ])
    AND CASE
        WHEN array_length(sqlc.arg(care_phase_ids) :: BIGINT [ ], 1) IS NOT NULL THEN episodes.care_phase_id = ANY(sqlc.arg(care_phase_ids) :: BIGINT [ ])
        ELSE TRUE
    END
    AND CASE
        WHEN array_length(sqlc.arg(service_line_ids) :: BIGINT [ ], 1) IS NOT NULL THEN episodes.service_line_id = ANY(sqlc.arg(service_line_ids) :: BIGINT [ ])
        ELSE TRUE
    END
    AND CASE
        WHEN sqlc.arg(incomplete_tasks) :: BOOLEAN IS TRUE THEN episodes_with_incomplete_tasks.id IS NOT NULL
        ELSE TRUE
    END
ORDER BY
    array_position(
        ARRAY [ 'High Acuity',
        'Transition',
        'Active',
        'Discharged',
        'Pending',
        'Closed' ] :: TEXT [ ],
        care_phases.name :: TEXT
    ),
    CASE
        WHEN episodes.discharged_at IS NULL THEN NOW() - episodes.admitted_at
        ELSE episodes.discharged_at - episodes.admitted_at
    END
LIMIT
    sqlc.arg(page_size) :: BIGINT OFFSET sqlc.arg(page_offset) :: BIGINT;

-- name: GetEpisode :one
SELECT
    *
FROM
    episodes
WHERE
    id = $1;

-- name: UpdateEpisode :one
UPDATE
    episodes
SET
    patient_summary = COALESCE(sqlc.narg(patient_summary), patient_summary),
    admitted_at = COALESCE(sqlc.narg(admitted_at), admitted_at),
    care_phase_id = COALESCE(sqlc.narg(care_phase_id), care_phase_id),
    service_line_id = COALESCE(sqlc.narg(service_line_id), service_line_id),
    market_id = COALESCE(sqlc.narg(market_id), market_id),
    discharged_at = sqlc.arg(discharged_at),
    is_waiver = COALESCE(sqlc.narg(is_waiver), is_waiver),
    original_care_request_id = COALESCE(
        sqlc.narg(original_care_request_id),
        original_care_request_id
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetEpisodeByOriginalCareRequestId :one
SELECT
    *
FROM
    episodes
WHERE
    original_care_request_id = sqlc.arg(original_care_request_id);
