-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY virtual_app_visit_phase_snapshots_created_at_idx ON virtual_app_visit_phase_snapshots(created_at DESC);

-- +goose Down
DROP INDEX CONCURRENTLY virtual_app_visit_phase_snapshots_created_at_idx;
