-- +goose Up
-- +goose StatementBegin
DROP INDEX IF EXISTS templates_folder_name_unique_idx;

CREATE INDEX templates_folder_name_idx ON templates(bucket_folder_id, name);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS templates_folder_name_idx;

CREATE UNIQUE INDEX templates_folder_name_unique_idx ON templates(bucket_folder_id, name);

-- +goose StatementEnd
