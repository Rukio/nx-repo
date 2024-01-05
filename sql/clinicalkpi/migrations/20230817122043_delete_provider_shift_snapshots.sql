-- +goose Up
-- +goose StatementBegin
DROP TABLE provider_shift_snapshots;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
CREATE TABLE provider_shift_snapshots (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    service_date DATE NOT NULL,
    shift_snapshot_phase_type_id BIGINT NOT NULL,
    start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE provider_shift_snapshots IS 'A table which contain information about provider shift snapshots for a specific day.';

COMMENT ON COLUMN provider_shift_snapshots.provider_id IS 'The ID of the provider that the metrics are associated with. Same as station user ID.';

COMMENT ON COLUMN provider_shift_snapshots.service_date IS 'Date of the shift snapshots.';

COMMENT ON COLUMN provider_shift_snapshots.shift_snapshot_phase_type_id IS 'Phase ID of the snapshot from shift_snapshot_phase_types table.';

COMMENT ON COLUMN provider_shift_snapshots.start_time IS 'Start time of the snapshot.';

COMMENT ON COLUMN provider_shift_snapshots.end_time IS 'End time of the snapshot.';

CREATE INDEX provider_shift_snapshots_provider_id_date_start_time_idx ON provider_shift_snapshots(provider_id, service_date DESC, start_time ASC);

COMMENT ON INDEX provider_shift_snapshots_provider_id_date_start_time_idx IS 'Lookup index on provider_shift_snapshots by provider_id, service_date and start_time';

-- +goose StatementEnd
