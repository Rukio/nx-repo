-- name: CreateVisitSummary :one
INSERT INTO
    visit_summaries (
        visit_id,
        body,
        created_by_user_id,
        updated_by_user_id
    )
VALUES
    ($1, $2, $3, $3) RETURNING *;

-- name: UpdateVisitSummary :one
UPDATE
    visit_summaries
SET
    body = COALESCE(sqlc.narg(body), body),
    updated_by_user_id = sqlc.arg(updated_by_user_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    visit_id = sqlc.arg(visit_id) RETURNING *;

-- name: GetVisitSummaryByVisitId :one
SELECT
    *
FROM
    visit_summaries
WHERE
    visit_id = sqlc.arg(visit_id);
