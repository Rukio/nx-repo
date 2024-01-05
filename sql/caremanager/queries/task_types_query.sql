-- name: GetAllTaskTypes :many
SELECT
    *
FROM
    task_types;

-- name: GetTaskType :one
SELECT
    *
FROM
    task_types
WHERE
    id = $1;

-- name: GetTaskTypesBySlug :many
SELECT
    *
FROM
    task_types
WHERE
    slug = ANY(sqlc.arg(slugs) :: TEXT [ ]);
