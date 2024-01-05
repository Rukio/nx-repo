-- name: CreateEpisodeTaskTemplate :one
INSERT INTO
    episodes_task_templates (episode_id, task_template_id)
VALUES
    ($1, $2) RETURNING *;

-- name: GetEpisodeTaskTemplatesIDs :many
SELECT
    task_template_id
FROM
    episodes_task_templates
WHERE
    episode_id = $1;
