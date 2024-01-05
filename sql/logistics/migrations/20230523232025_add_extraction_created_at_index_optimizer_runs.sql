-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY optimizer_runs_created_at_idx ON optimizer_runs(created_at DESC);

-- +goose Down
DROP INDEX CONCURRENTLY optimizer_runs_created_at_idx;
