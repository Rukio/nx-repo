-- name: CreateAccount :one
INSERT INTO
    accounts (auth0_id, email)
VALUES
    ($1, $2) RETURNING *;

-- name: UpdateAccount :one
UPDATE
    accounts
SET
    given_name = COALESCE(sqlc.narg(given_name), given_name),
    family_name = COALESCE(sqlc.narg(family_name), family_name),
    email = COALESCE(sqlc.narg(email), email),
    phone_number = COALESCE(sqlc.narg(phone_number), phone_number),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetAccount :one
SELECT
    *
FROM
    accounts
WHERE
    id = $1;

-- name: GetAccountByAuth0ID :one
SELECT
    *
FROM
    accounts
WHERE
    auth0_id = $1;
