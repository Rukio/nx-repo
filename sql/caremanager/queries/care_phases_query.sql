-- name: CreateCarePhase :one
INSERT INTO
    care_phases("name", "is_active")
VALUES
    ($1, $2) RETURNING *;

-- name: GetCarePhases :many
SELECT
    *
FROM
    care_phases;

-- name: GetCarePhasesByID :many
SELECT
    *
FROM
    care_phases
WHERE
    id = ANY(sqlc.arg(ids) :: BIGINT [ ]);

-- name: GetCarePhase :one
SELECT
    *
FROM
    care_phases
WHERE
    id = $1;

-- name: GetCarePhaseByName :one
SELECT
    *
FROM
    care_phases
WHERE
    name = $1;
