-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY optimizer_run_types_idx ON optimizer_runs(optimizer_run_type_id);

-- +goose Down
DROP INDEX CONCURRENTLY optimizer_run_types_idx;
