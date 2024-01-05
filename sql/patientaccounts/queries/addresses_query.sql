-- name: CreateAccountAddress :one
INSERT INTO
    addresses (
        account_id,
        address_line_one,
        address_line_two,
        city,
        state_code,
        zipcode,
        location_details,
        latitude_e6,
        longitude_e6,
        facility_type_id
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;

-- name: GetAccountAddress :one
SELECT
    *
FROM
    addresses
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: GetAddressesByAccountId :many
SELECT
    *
FROM
    addresses
WHERE
    account_id = $1
    AND deleted_at IS NULL;

-- name: CountAddressesByAccountId :one
SELECT
    COUNT(*)
FROM
    addresses
WHERE
    account_id = $1
    AND deleted_at IS NULL;

-- name: DeleteAddress :one
UPDATE
    addresses
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: UpdateAddress :one
UPDATE
    addresses
SET
    address_line_one = sqlc.arg(address_line_one),
    address_line_two = sqlc.arg(address_line_two),
    city = sqlc.arg(city),
    state_code = sqlc.arg(state_code),
    zipcode = sqlc.arg(zipcode),
    location_details = sqlc.arg(location_details),
    latitude_e6 = sqlc.arg(latitude_e6),
    longitude_e6 = sqlc.arg(longitude_e6),
    facility_type_id = sqlc.arg(facility_type_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;
