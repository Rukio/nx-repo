-- +goose Up
-- +goose StatementBegin
CREATE INDEX files_bucket_folder_id_idx ON files(bucket_folder_id);

CREATE INDEX templates_bucket_folder_id_idx ON templates(bucket_folder_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS files_bucket_folder_id_idx;

DROP INDEX IF EXISTS templates_bucket_folder_id_idx;

-- +goose StatementEnd
