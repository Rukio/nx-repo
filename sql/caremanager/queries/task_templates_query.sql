-- name: CreateTaskTemplate :one
INSERT INTO
    task_templates(
        "name",
        "summary",
        "service_line_id",
        "care_phase_id",
        "created_by_user_id",
        "last_updated_by_user_id"
    )
VALUES
    ($1, $2, $3, $4, $5, $5) RETURNING *;

-- TODO(AC-1310): Replace offset-based pagination
-- name: GetTaskTemplates :many
SELECT
    *,
    COUNT(*) OVER(),
    (
        SELECT
            COUNT(*)
        FROM
            task_template_tasks
        WHERE
            task_template_tasks.template_id = task_templates.id
    ) AS tasks_count
FROM
    task_templates
WHERE
    CASE
        WHEN sqlc.narg(template_name) :: TEXT IS NOT NULL THEN task_templates.name ILIKE CONCAT('%', sqlc.narg(template_name) :: TEXT, '%')
        ELSE TRUE
    END
    AND CASE
        WHEN sqlc.narg(care_phase_id) :: BIGINT [ ] IS NOT NULL THEN task_templates.care_phase_id = ANY(sqlc.narg(care_phase_id) :: BIGINT [ ])
        ELSE TRUE
    END
    AND CASE
        WHEN sqlc.narg(service_line_id) :: BIGINT [ ] IS NOT NULL THEN task_templates.service_line_id = ANY(sqlc.narg(service_line_id) :: BIGINT [ ])
        ELSE TRUE
    END
    AND deleted_at IS NULL
ORDER BY
    CASE
        WHEN sqlc.narg(sort_by) :: TEXT = 'name'
        AND sqlc.narg(sort_direction) :: TEXT = 'asc' THEN task_templates.name
    END ASC,
    CASE
        WHEN sqlc.narg(sort_by) :: TEXT = 'name'
        AND sqlc.narg(sort_direction) :: TEXT = 'desc' THEN task_templates.name
    END DESC,
    CASE
        WHEN sqlc.narg(sort_by) :: TEXT = 'updated_at'
        AND sqlc.narg(sort_direction) :: TEXT = 'asc' THEN task_templates.updated_at
    END ASC,
    CASE
        WHEN sqlc.narg(sort_by) :: TEXT = 'updated_at'
        AND sqlc.narg(sort_direction) :: TEXT = 'desc' THEN task_templates.updated_at
    END DESC,
    CASE
        WHEN sqlc.narg(sort_by) :: TEXT = 'care_phase_id'
        AND sqlc.narg(sort_direction) :: TEXT = 'asc' THEN task_templates.care_phase_id
    END ASC,
    CASE
        WHEN sqlc.narg(sort_by) :: TEXT = 'care_phase_id'
        AND sqlc.narg(sort_direction) :: TEXT = 'desc' THEN task_templates.care_phase_id
    END DESC,
    CASE
        WHEN sqlc.narg(sort_by) :: TEXT = 'service_line_id'
        AND sqlc.narg(sort_direction) :: TEXT = 'asc' THEN task_templates.service_line_id
    END ASC,
    CASE
        WHEN sqlc.narg(sort_by) :: TEXT = 'service_line_id'
        AND sqlc.narg(sort_direction) :: TEXT = 'desc' THEN task_templates.service_line_id
    END DESC
LIMIT
    sqlc.arg(page_size) :: BIGINT OFFSET sqlc.arg(page_offset) :: BIGINT;

-- name: UpdateTaskTemplate :one
UPDATE
    task_templates
SET
    name = COALESCE(sqlc.narg(name), name),
    service_line_id = COALESCE(sqlc.narg(service_line_id), service_line_id),
    summary = sqlc.narg(summary),
    care_phase_id = sqlc.narg(care_phase_id),
    updated_at = CURRENT_TIMESTAMP,
    last_updated_by_user_id = sqlc.arg(last_updated_by_user_id)
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: GetTaskTemplate :one
SELECT
    *
FROM
    task_templates
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL;

-- name: DeleteTaskTemplate :one
UPDATE
    task_templates
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: GetTaskTemplatesByID :many
SELECT
    *,
    (
        SELECT
            COUNT(*)
        FROM
            task_template_tasks
        WHERE
            task_template_tasks.template_id = task_templates.id
    ) AS tasks_count
FROM
    task_templates
WHERE
    task_templates.id = ANY(sqlc.arg(ids) :: BIGINT [ ])
    AND deleted_at IS NULL
ORDER BY
    created_at ASC;
