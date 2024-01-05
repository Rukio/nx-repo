-- name: GetTask :one
SELECT
    *
FROM
    tasks
WHERE
    id = $1;

-- name: GetTasksByEpisodeID :many
SELECT
    *
FROM
    tasks
WHERE
    episode_id = ANY(sqlc.arg(ids) :: BIGINT [ ])
    AND deleted_at IS NULL
    AND (
        is_completed = sqlc.narg(are_tasks_completed)
        OR sqlc.narg(are_tasks_completed) IS NULL
    )
ORDER BY
    episode_id,
    created_at,
    id;

-- name: CreateTasks :many
INSERT INTO
    tasks(description, is_completed, episode_id, task_type_id)
SELECT
    unnest(sqlc.arg(descriptions) :: TEXT [ ]) AS description,
    unnest(sqlc.arg(are_tasks_completed) :: BOOL [ ]) AS is_completed,
    unnest(sqlc.arg(episode_ids) :: BIGINT [ ]) AS episode_id,
    unnest(sqlc.arg(task_type_ids) :: BIGINT [ ]) AS task_type_id RETURNING *;

-- name: DeleteTask :one
UPDATE
    tasks
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: UpdateTask :one
UPDATE
    tasks
SET
    description = sqlc.arg(description),
    is_completed = sqlc.arg(is_completed),
    task_type_id = sqlc.arg(task_type_id),
    completed_by_user_id = sqlc.narg(completed_by_user_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;
