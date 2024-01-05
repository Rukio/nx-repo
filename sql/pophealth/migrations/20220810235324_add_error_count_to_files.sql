-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    IF EXISTS files
ADD
    COLUMN error_count BIGINT;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    IF EXISTS files DROP COLUMN error_count;

-- +goose StatementEnd
