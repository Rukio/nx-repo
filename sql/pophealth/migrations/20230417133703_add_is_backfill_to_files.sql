-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    files
ADD
    COLUMN is_backfill BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN files.is_backfill IS 'Indicates whether is a backfill file or not';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    files DROP COLUMN is_backfill;

-- +goose StatementEnd
