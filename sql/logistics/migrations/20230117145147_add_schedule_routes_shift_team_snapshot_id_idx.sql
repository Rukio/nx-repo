-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY schedule_routes_shift_team_snapshot_id_idx ON schedule_routes(shift_team_snapshot_id);

-- +goose Down
DROP INDEX CONCURRENTLY schedule_routes_shift_team_snapshot_id_idx;
