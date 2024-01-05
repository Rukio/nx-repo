-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    files
ADD
    COLUMN patients_deleted_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN files.patients_deleted_count IS 'Number of patients deleted, from results file';

ALTER TABLE
    files
ADD
    COLUMN patients_updated_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN files.patients_updated_count IS 'Number of patients updated, from results file';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    files DROP COLUMN patients_deleted_count;

ALTER TABLE
    files DROP COLUMN patients_updated_count;

-- +goose StatementEnd
