-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    IF EXISTS bucket_folder_email_notifications DROP COLUMN deleted_at;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    IF EXISTS bucket_folder_email_notifications
ADD
    COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- +goose StatementEnd
