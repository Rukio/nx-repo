-- name: CreateServiceLine :one
INSERT INTO
    service_lines("name", "short_name")
VALUES
    ($1, $2) RETURNING *;

-- name: GetServiceLines :many
SELECT
    *
FROM
    service_lines;

-- name: GetServiceLinesByID :many
SELECT
    *
FROM
    service_lines
WHERE
    id = ANY(sqlc.arg(ids) :: BIGINT [ ]);

-- name: GetServiceLine :one
SELECT
    *
FROM
    service_lines
WHERE
    id = $1;
