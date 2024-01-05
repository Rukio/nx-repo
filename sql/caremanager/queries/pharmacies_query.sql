-- name: CreatePharmacy :one
INSERT INTO
    pharmacies(name, phone_number, fax_number, address, patient_id)
VALUES
    ($1, $2, $3, $4, $5) RETURNING *;

-- name: UpdatePharmacy :one
UPDATE
    pharmacies
SET
    name = COALESCE(sqlc.narg(name), name),
    phone_number = COALESCE(sqlc.narg(phone_number), phone_number),
    fax_number = COALESCE(sqlc.narg(fax_number), fax_number),
    address = COALESCE(sqlc.narg(address), address),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetPatientPharmacies :many
SELECT
    *
FROM
    pharmacies
WHERE
    patient_id = $1
ORDER BY
    id;

-- name: GetPharmaciesByPatientIDs :many
SELECT
    *
FROM
    pharmacies
WHERE
    patient_id = ANY(sqlc.arg(patient_ids) :: BIGINT [ ]);

-- name: GetPharmacy :one
SELECT
    *
FROM
    pharmacies
WHERE
    id = sqlc.arg(id);
