-- name: AddBucketFolderEmailNotifications :one
INSERT INTO
    bucket_folder_email_notifications (email, bucket_folder_id)
VALUES
    ($1, $2) RETURNING *;

-- name: DeleteBucketFolderEmailNotifications :exec
DELETE FROM
    bucket_folder_email_notifications
WHERE
    bucket_folder_id = $1;

-- name: GetEmailNotificationsByBucketID :many
SELECT
    email
FROM
    bucket_folder_email_notifications
WHERE
    bucket_folder_id = $1
ORDER BY
    email;
