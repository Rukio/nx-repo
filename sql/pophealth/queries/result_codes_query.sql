-- name: GetResultCodeByID :one
SELECT
    *
FROM
    result_codes
WHERE
    id = $1;

-- name: GetResultCodeByCode :one
SELECT
    *
FROM
    result_codes
WHERE
    code = $1;

-- name: CreateResultCode :one
INSERT INTO
    result_codes (code, code_description, code_level)
VALUES
    ($1, $2, $3) RETURNING *;
