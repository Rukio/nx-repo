-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    files
ADD
    COLUMN file_parameters jsonb NOT NULL DEFAULT '{}' :: jsonb;

COMMENT ON COLUMN files.file_parameters IS 'Stores as a json object the force upload flag to be used when creating a prefect request';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    files DROP COLUMN file_parameters;

-- +goose StatementEnd
