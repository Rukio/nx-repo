-- name: GetAllServiceRequestStatus :many
SELECT
    *
FROM
    service_request_status;

-- name: GetServiceRequestStatus :one
SELECT
    *
FROM
    service_request_status
WHERE
    id = sqlc.arg(id);

-- name: GetServiceRequestStatusByName :one
SELECT
    *
FROM
    service_request_status
WHERE
    name = sqlc.arg(name);

-- name: GetServiceRequestStatusBySlug :one
SELECT
    *
FROM
    service_request_status
WHERE
    slug = sqlc.arg(slug);
