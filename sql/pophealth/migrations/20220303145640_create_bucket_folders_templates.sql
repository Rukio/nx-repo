-- +goose Up
-- +goose StatementBegin
CREATE TABLE bucket_folders (
    id bigserial PRIMARY KEY,
    name TEXT NOT NULL,
    s3_bucket_name TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX bucket_folders_unique_idx ON bucket_folders(name, s3_bucket_name);

CREATE INDEX bucket_folders_name_idx ON bucket_folders(name);

CREATE TABLE templates (
    id bigserial PRIMARY KEY,
    name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_identifier_type TEXT NOT NULL,
    file_identifier_value TEXT NOT NULL,
    column_mapping jsonb NOT NULL,
    channel_item_id BIGINT NOT NULL,
    bucket_folder_id BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX templates_folder_name_unique_idx ON templates(bucket_folder_id, name);

CREATE INDEX templates_name_idx ON templates(name, updated_at);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS bucket_folders;

DROP TABLE IF EXISTS templates;

-- +goose StatementEnd
