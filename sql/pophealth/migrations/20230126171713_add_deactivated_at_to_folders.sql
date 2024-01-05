-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    bucket_folders
ADD
    COLUMN deactivated_at TIMESTAMP WITH TIME ZONE;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    bucket_folders DROP COLUMN deactivated_at;

-- +goose StatementEnd
