-- +goose Up
-- +goose StatementBegin
CREATE TABLE clinical_urgency_levels (
    id bigserial PRIMARY KEY,
    short_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clinical_urgency_levels IS 'Available clinical urgency levels';

COMMENT ON COLUMN clinical_urgency_levels.short_name IS 'Short name to identify the level of urgency (low, medium, high, etc)';

CREATE UNIQUE INDEX clinical_urgency_levels_short_name_idx ON clinical_urgency_levels(short_name);

INSERT INTO
    clinical_urgency_levels(id, short_name)
VALUES
    (1, 'high_manual_override'),
    (2, 'high'),
    (3, 'normal'),
    (4, 'low');

CREATE TABLE visit_acuity_snapshots (
    id bigserial PRIMARY KEY,
    visit_snapshot_id BIGINT NOT NULL,
    clinical_urgency_level_id BIGINT NOT NULL,
    patient_age BIGINT,
    chief_complaint TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE visit_acuity_snapshots IS 'Acuity information for a visit snapshot';

COMMENT ON COLUMN visit_acuity_snapshots.visit_snapshot_id IS 'Visit Snapshot ID';

COMMENT ON COLUMN visit_acuity_snapshots.clinical_urgency_level_id IS 'Clinical urgency level';

COMMENT ON COLUMN visit_acuity_snapshots.patient_age IS 'Age of the patient';

COMMENT ON COLUMN visit_acuity_snapshots.chief_complaint IS 'The protocol name from the risk strat record';

CREATE UNIQUE INDEX visit_acuity_snapshots_visit_snapshot_idx ON visit_acuity_snapshots(visit_snapshot_id);

COMMENT ON INDEX visit_acuity_snapshots_visit_snapshot_idx IS 'Lookup index on visits acuity, by visit snapshot ID';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE visit_acuity_snapshots;

DROP TABLE clinical_urgency_levels;

-- +goose StatementEnd
