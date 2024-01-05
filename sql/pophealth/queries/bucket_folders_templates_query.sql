-- name: AddBucketFolder :one
INSERT INTO
    bucket_folders (name, s3_bucket_name)
VALUES
    ($1, $2) RETURNING *;

-- name: AddTemplateToBucketFolder :one
INSERT INTO
    templates (
        name,
        file_type,
        file_identifier_type,
        file_identifier_value,
        column_mapping,
        channel_item_id,
        bucket_folder_id,
        market_id
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;

-- name: UpdateBucketFolder :one
UPDATE
    bucket_folders
SET
    name = $2,
    s3_bucket_name = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: DeactivateBucketFolder :one
UPDATE
    bucket_folders
SET
    deactivated_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: ActivateBucketFolder :one
UPDATE
    bucket_folders
SET
    deactivated_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: UpdateTemplateByID :one
UPDATE
    templates
SET
    name = $2,
    file_type = $3,
    file_identifier_type = $4,
    file_identifier_value = $5,
    column_mapping = $6,
    channel_item_id = $7,
    bucket_folder_id = $8,
    market_id = $9,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: GetBucketFolders :many
SELECT
    *
FROM
    bucket_folders
WHERE
    deactivated_at IS NULL
ORDER BY
    name
LIMIT
    100;

-- name: GetBucketFolderByID :one
SELECT
    *
FROM
    bucket_folders
WHERE
    id = $1;

-- name: GetBucketFolderByS3BucketName :one
SELECT
    *
FROM
    bucket_folders
WHERE
    s3_bucket_name = $1;

-- name: GetTemplateByID :one
SELECT
    *
FROM
    templates
WHERE
    id = $1;

-- name: GetTemplatesInBucketFolder :many
SELECT
    *
FROM
    templates
WHERE
    bucket_folder_id = $1
ORDER BY
    updated_at DESC;

-- name: GetActiveTemplatesInBucketFolder :many
SELECT
    *
FROM
    templates
WHERE
    bucket_folder_id = $1
    AND deleted_at IS NULL
ORDER BY
    updated_at DESC;

-- name: DeleteTemplateByID :one
UPDATE
    templates
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: DeleteTemplatesByChannelItemIDs :many
UPDATE
    templates
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    channel_item_id = ANY(sqlc.arg(channel_item_ids) :: BIGINT [ ]) RETURNING *;

-- name: DeleteBucketFolder :exec
DELETE FROM
    bucket_folders
WHERE
    id = $1;

-- name: GetFilesAndTemplatesCount :one
SELECT
    files_count.num_files,
    templates_count.num_templates
FROM
    (
        SELECT
            count(*) AS num_files
        FROM
            files f
        WHERE
            f.bucket_folder_id = $1
    ) files_count,
    (
        SELECT
            count(*) AS num_templates
        FROM
            templates t
        WHERE
            t.bucket_folder_id = $1
    ) templates_count;

-- name: GetTemplateByChannelItemID :one
SELECT
    t.*
FROM
    templates t
WHERE
    t.channel_item_id = $2
    AND t.deleted_at IS NULL
    AND (
        NOT(sqlc.arg(template_id_filter_enabled) :: bool)
        OR (t.id != $1)
    )
LIMIT
    1;

-- name: GetTemplateByBucketFolderAndName :one
SELECT
    t.*
FROM
    templates t
WHERE
    t.bucket_folder_id = $2
    AND t.name = $3
    AND t.deleted_at IS NULL
    AND (
        NOT(sqlc.arg(template_id_filter_enabled) :: bool)
        OR (t.id != $1)
    )
LIMIT
    1;
