-- name: CreateMedicalDecisionMaker :one
INSERT INTO
    medical_decision_makers(
        first_name,
        last_name,
        phone_number,
        address,
        relationship,
        patient_id
    )
VALUES
    ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: UpdateMedicalDecisionMaker :one
UPDATE
    medical_decision_makers
SET
    first_name = COALESCE(sqlc.narg(first_name), first_name),
    last_name = COALESCE(sqlc.narg(last_name), last_name),
    phone_number = COALESCE(sqlc.narg(phone_number), phone_number),
    address = COALESCE(sqlc.narg(address), address),
    relationship = COALESCE(sqlc.narg(relationship), relationship)
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetPatientMedicalDecisionMakers :many
SELECT
    *
FROM
    medical_decision_makers
WHERE
    patient_id = $1
ORDER BY
    id;

-- name: GetMedicalDecisionMakersByPatientIDs :many
SELECT
    *
FROM
    medical_decision_makers
WHERE
    patient_id = ANY(sqlc.arg(patient_ids) :: BIGINT [ ]);

-- name: GetMedicalDecisionMaker :one
SELECT
    *
FROM
    medical_decision_makers
WHERE
    id = sqlc.arg(id);
