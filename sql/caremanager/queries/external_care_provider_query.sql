-- name: CreateExternalCareProviderWithProviderTypeName :one
WITH pt AS (
    SELECT
        id
    FROM
        provider_types
    WHERE
        provider_types.name = sqlc.arg(provider_type_name) :: TEXT
)
INSERT INTO
    external_care_providers(
        name,
        phone_number,
        fax_number,
        address,
        provider_type_id,
        patient_id
    )
SELECT
    sqlc.arg(name),
    sqlc.arg(phone_number),
    sqlc.arg(fax_number),
    sqlc.arg(address),
    pt.id,
    sqlc.arg(patient_id)
FROM
    pt RETURNING *;

-- name: CreateExternalCareProvider :one
INSERT INTO
    external_care_providers(
        name,
        phone_number,
        fax_number,
        address,
        provider_type_id,
        patient_id
    )
VALUES
    (
        sqlc.arg(name),
        sqlc.arg(phone_number),
        sqlc.arg(fax_number),
        sqlc.arg(address),
        sqlc.arg(provider_type_id),
        sqlc.arg(patient_id)
    ) RETURNING *;

-- name: UpdateExternalCareProvider :one
UPDATE
    external_care_providers
SET
    name = COALESCE(sqlc.narg(name), name),
    phone_number = COALESCE(sqlc.narg(phone_number), phone_number),
    fax_number = COALESCE(sqlc.narg(fax_number), fax_number),
    address = COALESCE(sqlc.narg(address), address),
    provider_type_id = COALESCE(sqlc.narg(provider_type_id), provider_type_id)
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: GetPatientExternalCareProviders :many
SELECT
    *
FROM
    external_care_providers
WHERE
    patient_id = $1
    AND deleted_at IS NULL
ORDER BY
    id;

-- name: GetExternalCareProvidersByPatientIDs :many
SELECT
    *
FROM
    external_care_providers
WHERE
    patient_id = ANY(sqlc.arg(patient_ids) :: BIGINT [ ])
    AND deleted_at IS NULL;

-- name: GetPatientExternalCareProvider :one
SELECT
    *
FROM
    external_care_providers
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL;

-- name: DeleteExternalCareProvider :one
UPDATE
    external_care_providers
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;
