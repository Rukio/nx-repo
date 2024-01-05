-- +goose Up
-- +goose StatementBegin
CREATE UNIQUE INDEX bucket_folders_s3_bucket_name_unique_idx ON bucket_folders(s3_bucket_name);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS bucket_folders_s3_bucket_name_unique_idx;

-- +goose StatementEnd
