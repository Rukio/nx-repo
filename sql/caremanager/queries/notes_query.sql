-- name: CreateNote :one
INSERT INTO
    notes (body, kind, episode_id, created_by_user_id)
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: CreateServiceRequestNote :one
INSERT INTO
    service_request_notes (service_request_id, note_id)
VALUES
    ($1, $2) RETURNING *;

-- name: UnpinNote :one
UPDATE
    notes
SET
    pinned = FALSE,
    updated_at = NOW()
WHERE
    id = $1
    AND deleted_at IS NULL RETURNING *;

-- name: UpdateNote :one
UPDATE
    notes
SET
    body = COALESCE(sqlc.narg(body), body),
    kind = COALESCE(sqlc.narg(kind), kind),
    last_updated_by_user_id = sqlc.arg(last_updated_by_user_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: PinNote :one
UPDATE
    notes
SET
    pinned = TRUE,
    updated_at = NOW()
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: GetNote :one
SELECT
    *
FROM
    notes
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL;

-- name: GetEpisodeNotesSortedByRelevance :many
SELECT
    *
FROM
    notes
WHERE
    episode_id = sqlc.arg(episode_id) :: BIGINT
    AND deleted_at IS NULL
ORDER BY
    pinned DESC,
    updated_at DESC;

-- name: GetServiceRequestNotesSortedByRelevance :many
SELECT
    notes.*
FROM
    notes
    JOIN service_request_notes ON service_request_notes.note_id = notes.id
WHERE
    service_request_notes.service_request_id = sqlc.arg(service_request_id) :: BIGINT
    AND notes.deleted_at IS NULL
ORDER BY
    notes.pinned DESC,
    notes.updated_at DESC;

-- name: GetMostRelevantNotePerEpisodeID :many
SELECT
    DISTINCT ON (episode_id) notes.*
FROM
    notes
WHERE
    episode_id = ANY(sqlc.arg(episode_ids) :: BIGINT [ ])
    AND deleted_at IS NULL
ORDER BY
    episode_id,
    pinned DESC,
    updated_at DESC;

-- name: GetEpisodePinnedNotesCount :one
SELECT
    count(*)
FROM
    notes
WHERE
    pinned = TRUE
    AND episode_id = sqlc.arg(episode_id) :: BIGINT
    AND deleted_at IS NULL;

-- name: DeleteNote :one
UPDATE
    notes
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetNotesCountByServiceRequestID :many
SELECT
    service_request_notes.service_request_id,
    count(*) AS note_count
FROM
    notes
    JOIN service_request_notes ON service_request_notes.note_id = notes.id
WHERE
    service_request_notes.service_request_id = ANY(sqlc.arg(service_request_ids) :: BIGINT [ ])
    AND notes.deleted_at IS NULL
GROUP BY
    service_request_notes.service_request_id;
