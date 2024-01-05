-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY schedules_created_at_idx ON schedules(created_at DESC);

-- +goose Down
DROP INDEX CONCURRENTLY schedules_created_at_idx;
