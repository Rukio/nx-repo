-- +goose Up
-- +goose StatementBegin
CREATE INDEX bucket_folder_aws_object_key_idx ON files(bucket_folder_id, aws_object_key);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS bucket_folder_aws_object_key_idx;

-- +goose StatementEnd
