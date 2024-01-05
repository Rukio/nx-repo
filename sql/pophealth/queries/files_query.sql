-- name: AddFile :one
INSERT INTO
    files (
        filename,
        status,
        bucket_folder_id,
        aws_object_key,
        template_id,
        file_parameters,
        is_backfill
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: UpdateFileByID :one
UPDATE
    files
SET
    number_of_patients_loaded = $2,
    patients_updated_count = $3,
    patients_deleted_count = $4,
    status = $5,
    processed_at = $6,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: UpdateFileStatusByID :one
UPDATE
    files
SET
    processed_at = $2,
    status = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: UpdateTemplateInFileByID :one
UPDATE
    files
SET
    template_id = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: DeleteFileByID :one
UPDATE
    files
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: GetFileByID :one
SELECT
    *
FROM
    files
WHERE
    id = $1;

-- name: GetFileCountForBucketFolder :one
SELECT
    COUNT(*)
FROM
    files f
WHERE
    f.bucket_folder_id = $1
    AND (
        NOT(sqlc.arg(status_filter_enabled) :: bool)
        OR (
            CASE
                WHEN sqlc.arg(search_for_processed) :: bool THEN (f.status = sqlc.arg(status_processed))
                ELSE f.status <> sqlc.arg(status_processed)
            END
        )
    )
    AND (
        NOT(sqlc.arg(search_name_enabled) :: bool)
        OR LOWER(f.filename) LIKE concat(LOWER(sqlc.arg(name_searched)) :: TEXT, '%')
    );

-- name: GetFilesByBucket :many
SELECT
    f.id,
    f.filename,
    f.status,
    f.created_at,
    f.processed_at,
    f.is_backfill,
    f.file_parameters,
    t.name AS template_name,
    t.file_type
FROM
    files f
    LEFT OUTER JOIN templates t ON f.template_id = t.id
WHERE
    f.bucket_folder_id = $1
    AND (
        NOT(sqlc.arg(last_id_filter_enabled) :: bool)
        OR (
            CASE
                WHEN sqlc.arg(is_paging_forward) :: bool THEN (f.id < sqlc.arg(last_id_seen) :: BIGINT)
                ELSE f.id > sqlc.arg(last_id_seen) :: BIGINT
            END
        )
    )
    AND (
        NOT(sqlc.arg(status_filter_enabled) :: bool)
        OR (
            CASE
                WHEN sqlc.arg(search_for_processed) :: bool THEN (f.status = sqlc.arg(status_processed))
                ELSE f.status <> sqlc.arg(status_processed)
            END
        )
    )
    AND (
        NOT(sqlc.arg(search_name_enabled) :: bool)
        OR LOWER(f.filename) LIKE concat(LOWER(sqlc.arg(name_searched)) :: TEXT, '%')
    )
ORDER BY
    f.id DESC;

-- name: GetFileAndBucketFolderByFileID :one
SELECT
    f.id AS file_id,
    f.filename AS filename,
    f.status,
    f.number_of_patients_loaded,
    f.patients_updated_count,
    f.patients_deleted_count,
    f.template_id,
    bf.s3_bucket_name,
    bf.name AS bucket_folder_name,
    f.aws_object_key,
    f.bucket_folder_id,
    f.is_backfill
FROM
    files f
    JOIN bucket_folders bf ON bf.id = f.bucket_folder_id
WHERE
    f.id = $1;

-- name: UpdateAwsObjectKeyInFilesByID :one
UPDATE
    files
SET
    aws_object_key = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: UpdateFileStartProcessingByID :one
UPDATE
    files
SET
    submitted_at = CURRENT_TIMESTAMP,
    prefect_flow_run_id = $2,
    status = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: GetFileByPrefectFlowRunID :one
SELECT
    id,
    filename,
    aws_object_key,
    status,
    bucket_folder_id,
    template_id,
    is_backfill,
    file_parameters,
    submitted_at,
    created_at
FROM
    files
WHERE
    prefect_flow_run_id = $1;

-- name: GetFileByBucketAndObjectKey :one
SELECT
    *
FROM
    files
WHERE
    bucket_folder_id = $1
    AND aws_object_key = $2
    AND status = $3
ORDER BY
    created_at DESC
LIMIT
    1;

-- name: GetOldestFileByStatusWithChannelItem :one
SELECT
    f.*
FROM
    files f
    JOIN templates t ON t.id = f.template_id
WHERE
    f.status = $1
    AND t.channel_item_id = $2
    AND f.is_backfill = $3
    AND f.deleted_at IS NULL
ORDER BY
    f.updated_at
LIMIT
    1;

-- name: GetExpiredFiles :many
SELECT
    f.*,
    b.name
FROM
    files f
    JOIN templates t ON t.id = f.template_id
    JOIN bucket_folders b ON t.bucket_folder_id = b.id
WHERE
    f.status = 'processing'
    AND f.updated_at < $1
    AND NOT f.is_backfill
ORDER BY
    f.updated_at ASC;

-- name: GetFilesByChannelItemAndBucketID :many
SELECT
    f.*
FROM
    files f
    JOIN templates t ON t.id = f.template_id
WHERE
    f.bucket_folder_id = $1
    AND t.channel_item_id = ANY(sqlc.arg(channel_item_ids) :: BIGINT [ ])
    AND f.deleted_at IS NULL;

-- name: GetProcessingBackfillFileByChannelItemID :one
SELECT
    f.*
FROM
    files f
    JOIN templates t ON t.id = f.template_id
WHERE
    t.channel_item_id = $1
    AND f.is_backfill
    AND f.status = 'processing'
LIMIT
    1;

-- name: GetNumberOfProcessingBackfillFiles :one
SELECT
    COUNT(*)
FROM
    files f
WHERE
    f.is_backfill
    AND f.status = 'processing'
    AND deleted_at IS NULL;
