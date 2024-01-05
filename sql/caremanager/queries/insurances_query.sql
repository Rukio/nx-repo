-- name: CreateInsurance :one
INSERT INTO
    insurances(name, patient_id, member_id, priority)
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: UpdateInsurance :one
UPDATE
    insurances
SET
    name = COALESCE(sqlc.narg(name), name),
    member_id = NULLIF(COALESCE(sqlc.narg(member_id), member_id), ''),
    priority = COALESCE(sqlc.narg(priority), priority)
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetPatientInsurances :many
SELECT
    *
FROM
    insurances
WHERE
    patient_id = $1
    AND deleted_at IS NULL
ORDER BY
    priority,
    id;

-- name: GetInsurancesByPatientIDs :many
SELECT
    *
FROM
    insurances
WHERE
    patient_id = ANY(sqlc.arg(patient_ids) :: BIGINT [ ]);

-- name: CreateInsurances :many
INSERT INTO
    insurances(name, patient_id, member_id, priority)
SELECT
    unnest(sqlc.arg(name) :: TEXT [ ]) AS name,
    unnest(sqlc.arg(patient_id) :: BIGINT [ ]) AS patient_id,
    unnest(sqlc.arg(member_id) :: TEXT [ ]) AS member_id,
    unnest(sqlc.arg(priority) :: INTEGER [ ]) AS priority RETURNING *;

-- name: GetInsurance :one
SELECT
    *
FROM
    insurances
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL;

-- name: DeleteInsurance :one
UPDATE
    insurances
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;
