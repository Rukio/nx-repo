-- name: GetLocationByID :one
SELECT
    *
FROM
    locations
WHERE
    id = $1;

-- name: AddLocation :one
INSERT INTO
    locations (
        address_line_one,
        address_line_two,
        city,
        state_code,
        zip_code,
        latitude_e6,
        longitude_e6
    )
VALUES
    (
        sqlc.narg(address_line_one),
        sqlc.narg(address_line_two),
        sqlc.narg(city),
        sqlc.narg(state_code),
        sqlc.narg(zip_code),
        sqlc.narg(latitude_e6),
        sqlc.narg(longitude_e6)
    ) RETURNING *;

-- name: UpdateLocation :one
UPDATE
    locations
SET
    address_line_one = sqlc.arg(address_line_one),
    address_line_two = sqlc.arg(address_line_two),
    city = sqlc.arg(city),
    state_code = sqlc.arg(state_code),
    zip_code = sqlc.arg(zip_code),
    latitude_e6 = sqlc.arg(latitude_e6),
    longitude_e6 = sqlc.arg(longitude_e6),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;
