-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    optimizer_runs
ADD
    COLUMN distance_source_id BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN optimizer_runs.distance_source_id IS 'distance source used to get distances';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    optimizer_runs DROP COLUMN distance_source_id;

-- +goose StatementEnd
