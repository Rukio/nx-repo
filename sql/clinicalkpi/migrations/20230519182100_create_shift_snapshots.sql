-- +goose Up
-- +goose StatementBegin
CREATE TABLE shift_snapshot_phase_types(
    id bigserial PRIMARY KEY,
    short_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shift_snapshot_phase_types IS 'Types of shift snapshot phases';

COMMENT ON COLUMN shift_snapshot_phase_types.short_name IS 'Short name of the shift snapshot phase type';

COMMENT ON COLUMN shift_snapshot_phase_types.description IS 'Description of the shift snapshot phase type';

CREATE UNIQUE INDEX shift_snapshot_phase_types_short_name_idx ON shift_snapshot_phase_types(short_name);

INSERT INTO
    shift_snapshot_phase_types(id, short_name, description)
VALUES
    (1, 'idle', 'Idle'),
    (2, 'on_route', 'En Route'),
    (3, 'on_scene', 'On Scene'),
    (4, 'break', 'Break');

CREATE TABLE shift_snapshots(
    id bigserial PRIMARY KEY,
    shift_team_id BIGINT NOT NULL,
    start_timestamp TIMESTAMP NOT NULL,
    end_timestamp TIMESTAMP NOT NULL,
    shift_snapshot_phase_type_id BIGINT NOT NULL,
    latitude_e6 INTEGER,
    longitude_e6 INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shift_team_id, start_timestamp)
);

COMMENT ON TABLE shift_snapshots IS 'Snapshot of the provider`s shift.';

COMMENT ON COLUMN shift_snapshots.id IS 'The unique ID of the snapshot.';

COMMENT ON COLUMN shift_snapshots.shift_team_id IS 'The ID of the shift the snapshot is part of. The same as Station shift team ID';

COMMENT ON COLUMN shift_snapshots.start_timestamp IS 'Start time of the snapshot.';

COMMENT ON COLUMN shift_snapshots.end_timestamp IS 'End time of the snapshot.';

COMMENT ON COLUMN shift_snapshots.shift_snapshot_phase_type_id IS 'Phase ID of the snapshot from shift_snapshot_phase_types table.';

COMMENT ON COLUMN shift_snapshots.latitude_e6 IS 'Latitude coordinate of provider`s location as the start of the snapshot. Multiplied by 1e6.';

COMMENT ON COLUMN shift_snapshots.longitude_e6 IS 'Longitude coordinate of provider`s location as the start of the snapshot. Multiplied by 1e6.';

CREATE INDEX shift_snapshots_shift_team_id_idx ON shift_snapshots(shift_team_id);

COMMENT ON INDEX shift_snapshots_shift_team_id_idx IS 'Index of shift snapshots shift team IDs.';

CREATE INDEX shift_snapshots_start_timestamp_idx ON shift_snapshots(start_timestamp);

COMMENT ON INDEX shift_snapshots_start_timestamp_idx IS 'Index of shift snapshots phase start times.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS shift_snapshots;

DROP TABLE IF EXISTS shift_snapshot_phase_types;

-- +goose StatementEnd
