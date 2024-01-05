-- name: GetVisitTypes :many
SELECT
    *
FROM
    visit_types
ORDER BY
    name ASC;

-- name: GetVisitTypeByName :one
SELECT
    *
FROM
    visit_types
WHERE
    name = sqlc.arg(name);

-- name: GetVisitType :one
SELECT
    *
FROM
    visit_types
WHERE
    id = sqlc.arg(id);
