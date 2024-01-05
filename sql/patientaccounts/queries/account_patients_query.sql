-- name: ListAccountPatientLinks :many
SELECT
    *
FROM
    account_patient_links
WHERE
    account_id = $1
    AND deleted_at IS NULL;

-- name: CountAccountPatientLinks :one
SELECT
    COUNT(*)
FROM
    account_patient_links
WHERE
    account_id = $1
    AND deleted_at IS NULL;

-- name: GetAccountByPatientId :one
SELECT
    *
FROM
    account_patient_links
WHERE
    patient_id = $1
    AND deleted_at IS NULL;

-- name: GetAccountPatientLinkByUnverifiedPatientId :one
SELECT
    *
FROM
    account_patient_links
WHERE
    unverified_patient_id = $1
    AND deleted_at IS NULL;

-- name: AddAccountPatientLink :one
INSERT INTO
    account_patient_links (
        account_id,
        patient_id,
        unverified_patient_id,
        access_level_id,
        consenting_relationship_id
    )
VALUES
    ($1, $2, $3, $4, $5) RETURNING *;

-- name: DeleteAccountPatientLink :one
UPDATE
    account_patient_links
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: GetAccountPatientLink :one
SELECT
    *
FROM
    account_patient_links
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: UpdateAccountPatientLink :one
UPDATE
    account_patient_links
SET
    access_level_id = sqlc.arg(access_level_id),
    consenting_relationship_id = sqlc.arg(consenting_relationship_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;
