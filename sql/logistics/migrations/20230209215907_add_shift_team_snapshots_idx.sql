-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY shift_team_snapshots_service_region_time_window_idx ON shift_team_snapshots (
    service_region_id,
    created_at DESC,
    start_timestamp_sec,
    end_timestamp_sec DESC
);

-- +goose Down
DROP INDEX CONCURRENTLY shift_team_snapshots_service_region_time_window_idx;
