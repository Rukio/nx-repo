-- name: GetAllServiceRequestCategories :many
SELECT
    *
FROM
    service_request_categories;

-- name: GetServiceRequestCategoryBySlug :one
SELECT
    *
FROM
    service_request_categories
WHERE
    slug = sqlc.arg(slug);
