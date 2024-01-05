-- +goose Up
-- +goose StatementBegin
CREATE TYPE file_status AS ENUM (
    'unspecified',
    'new',
    'preprocess',
    'invalid',
    'failed',
    'processed'
);

ALTER TABLE
    files
ALTER COLUMN
    status TYPE file_status USING status :: TEXT :: file_status;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    files;

ALTER TABLE
    files
ALTER COLUMN
    status TYPE INT USING (status :: TEXT :: INTEGER);

DROP TYPE file_status;

-- +goose StatementEnd
