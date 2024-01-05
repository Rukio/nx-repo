-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY schedule_stops_created_at_idx ON schedule_stops(created_at DESC);

-- +goose Down
DROP INDEX CONCURRENTLY schedule_stops_created_at_idx;
