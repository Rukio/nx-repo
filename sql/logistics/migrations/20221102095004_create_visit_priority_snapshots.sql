-- +goose Up
-- +goose StatementBegin
CREATE TABLE visit_priority_snapshots (
    id bigserial PRIMARY KEY,
    visit_snapshot_id BIGINT NOT NULL,
    requested_by_user_id BIGINT,
    requested_timestamp_sec BIGINT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE visit_priority_snapshots IS 'Priority information for a visit snapshot';

COMMENT ON COLUMN visit_priority_snapshots.visit_snapshot_id IS 'Visit Snapshot ID';

COMMENT ON COLUMN visit_priority_snapshots.requested_by_user_id IS 'Station User ID that prioritized the visit';

COMMENT ON COLUMN visit_priority_snapshots.requested_timestamp_sec IS 'Timestamp of the prioritization of the visit';

COMMENT ON COLUMN visit_priority_snapshots.note IS 'Note explaining the reason for the prioritization of the visit';

CREATE UNIQUE INDEX visit_priority_snapshots_visit_snapshot_idx ON visit_priority_snapshots(visit_snapshot_id);

COMMENT ON INDEX visit_priority_snapshots_visit_snapshot_idx IS 'Lookup index on visits priority, by visit snapshot ID';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE visit_priority_snapshots;

-- +goose StatementEnd
