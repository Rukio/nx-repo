-- +goose Up
-- +goose StatementBegin
ALTER TYPE file_status
ADD
    VALUE 'waiting'
AFTER
    'preprocess';

ALTER TYPE file_status
ADD
    VALUE 'processing' BEFORE 'processed';

UPDATE
    result_codes
SET
    code_description = 'Determine other files are processing failed'
WHERE
    code = 'Int-09';

CREATE INDEX channel_item_id_idx ON templates(channel_item_id);

CREATE INDEX files_updated_status_idx ON files(status, updated_at);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS channel_item_id_idx;

DROP INDEX IF EXISTS files_updated_status_idx;

UPDATE
    files
SET
    status = 'preprocess'
WHERE
    status = 'waiting'
    OR status = 'processing';

ALTER TYPE file_status RENAME TO file_status_old;

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

DROP TYPE file_status_old;

UPDATE
    result_codes
SET
    code_description = 'Acquiring lock failed'
WHERE
    code = 'Int-09';

-- +goose StatementEnd
