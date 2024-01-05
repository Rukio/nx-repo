-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    IF EXISTS files
ALTER COLUMN
    aws_object_key DROP NOT NULL,
ALTER COLUMN
    template_id DROP NOT NULL,
ADD
    COLUMN IF NOT EXISTS prefect_flow_run_id TEXT;

ALTER TABLE
    IF EXISTS files RENAME COLUMN completed_at TO submitted_at;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    IF EXISTS files
ALTER COLUMN
    aws_object_key
SET
    NOT NULL,
ALTER COLUMN
    template_id
SET
    NOT NULL,
    DROP COLUMN IF EXISTS prefect_flow_run_id;

ALTER TABLE
    IF EXISTS files RENAME COLUMN submitted_at TO completed_at;

-- +goose StatementEnd
