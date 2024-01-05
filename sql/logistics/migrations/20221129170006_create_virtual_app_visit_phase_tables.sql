-- +goose Up
-- +goose StatementBegin
CREATE TABLE virtual_app_visit_phase_types (
    id BIGSERIAL PRIMARY KEY,
    short_name TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE virtual_app_visit_phase_types IS 'Status of visits as members of Virtual APP shifts interact with them';

COMMENT ON COLUMN virtual_app_visit_phase_types.short_name IS 'Short name for Virtual APP phase';

COMMENT ON COLUMN virtual_app_visit_phase_types.description IS 'Description of the virtual APP phase';

INSERT INTO
    virtual_app_visit_phase_types(short_name, description)
VALUES
    ('unassigned', 'Unassigned'),
    ('assigned', 'Assigned');

CREATE TABLE virtual_app_visit_phase_snapshots (
    id bigserial PRIMARY KEY,
    visit_snapshot_id BIGINT NOT NULL,
    virtual_app_visit_phase_type_id BIGINT NOT NULL,
    visit_phase_source_type_id BIGINT NOT NULL,
    station_user_id BIGINT,
    shift_team_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE virtual_app_visit_phase_snapshots IS 'Snapshots of visit APP phases, 1:1 with telepresentation visit_snapshots';

COMMENT ON COLUMN virtual_app_visit_phase_snapshots.visit_snapshot_id IS 'Visit snapshot ID for the virtual APP visit phase';

COMMENT ON COLUMN virtual_app_visit_phase_snapshots.virtual_app_visit_phase_type_id IS 'Virtual APP visit phase type';

COMMENT ON COLUMN virtual_app_visit_phase_snapshots.visit_phase_source_type_id IS 'Virtual APP visit phase source type';

COMMENT ON COLUMN virtual_app_visit_phase_snapshots.station_user_id IS 'Station User ID that added this virtual APP visit phase';

COMMENT ON COLUMN virtual_app_visit_phase_snapshots.shift_team_id IS 'The shift team associated with the care requests status';

CREATE UNIQUE INDEX virtual_app_visit_phase_snapshots_snapshot_idx ON virtual_app_visit_phase_snapshots(visit_snapshot_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE virtual_app_visit_phase_snapshots;

DROP TABLE virtual_app_visit_phase_types;

-- +goose StatementEnd
