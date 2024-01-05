-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    bucket_folder_email_notifications
ADD
    CONSTRAINT bucket_folder_email_notifications_unique UNIQUE USING INDEX bucket_folder_email_notifications_unique_idx;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    bucket_folder_email_notifications DROP CONSTRAINT bucket_folder_email_notifications_unique;

-- +goose StatementEnd
