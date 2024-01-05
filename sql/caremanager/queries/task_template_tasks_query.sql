-- name: GetTasksForTemplates :many
SELECT
    *
FROM
    task_template_tasks
WHERE
    template_id = $1
    AND deleted_at IS NULL
ORDER BY
    id;

-- name: UpdateTaskTemplateTask :one
UPDATE
    task_template_tasks
SET
    body = COALESCE(sqlc.narg(body), body),
    type_id = COALESCE(sqlc.narg(type_id), type_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND template_id = sqlc.arg(template_id)
    AND deleted_at IS NULL RETURNING *;

-- name: DeleteTaskTemplateTask :one
UPDATE
    task_template_tasks
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND template_id = sqlc.arg(template_id) RETURNING *;

-- name: DeleteTaskTemplateTasks :exec
UPDATE
    task_template_tasks
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    template_id = $1;

-- name: CreateTemplateTasks :many
INSERT INTO
    task_template_tasks(body, type_id, template_id)
SELECT
    unnest(sqlc.arg(bodies) :: TEXT [ ]) AS body,
    unnest(sqlc.arg(type_ids) :: BIGINT [ ]) AS type_id,
    unnest(sqlc.arg(template_ids) :: BIGINT [ ]) AS template_id RETURNING *;

-- name: CreateTemplateTask :one
INSERT INTO
    task_template_tasks("body", "type_id", "template_id")
VALUES
    ($1, $2, $3) RETURNING *;
