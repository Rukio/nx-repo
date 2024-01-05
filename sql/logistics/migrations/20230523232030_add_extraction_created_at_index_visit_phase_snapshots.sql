-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY visit_phase_snapshots_created_at_idx ON visit_phase_snapshots(created_at DESC);

-- +goose Down
DROP INDEX CONCURRENTLY visit_phase_snapshots_created_at_idx;
