-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY schedule_rest_breaks_created_at_idx ON schedule_rest_breaks(created_at DESC);

-- +goose Down
DROP INDEX CONCURRENTLY schedule_rest_breaks_created_at_idx;
