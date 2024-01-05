-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY schedule_routes_created_at_idx ON schedule_routes(created_at DESC);

-- +goose Down
DROP INDEX CONCURRENTLY schedule_routes_created_at_idx;
