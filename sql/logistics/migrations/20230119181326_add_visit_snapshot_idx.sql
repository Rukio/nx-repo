-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
CREATE INDEX CONCURRENTLY visit_snapshots_region_arrival_time_idx ON visit_snapshots(
    service_region_id,
    created_at DESC,
    arrival_start_timestamp_sec,
    arrival_end_timestamp_sec DESC
);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX CONCURRENTLY visit_snapshots_region_arrival_time_idx;

-- +goose StatementEnd
