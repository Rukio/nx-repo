-- +goose Up
-- +goose StatementBegin
CREATE TABLE shift_team_snapshots (
    id bigserial PRIMARY KEY,
    shift_team_id BIGINT NOT NULL,
    service_region_id BIGINT NOT NULL,
    base_location_id BIGINT NOT NULL,
    start_timestamp_sec BIGINT NOT NULL,
    end_timestamp_sec BIGINT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shift_team_snapshots IS 'Snapshots of shift team data';

COMMENT ON COLUMN shift_team_snapshots.shift_team_id IS 'Shift team ID';

COMMENT ON COLUMN shift_team_snapshots.service_region_id IS 'Service region';

COMMENT ON COLUMN shift_team_snapshots.base_location_id IS 'Location';

COMMENT ON COLUMN shift_team_snapshots.start_timestamp_sec IS 'Shift start timestamp, in seconds';

COMMENT ON COLUMN shift_team_snapshots.end_timestamp_sec IS 'Shift end timestamp, in seconds';

CREATE INDEX shift_team_snapshots_shift_team_idx ON shift_team_snapshots(shift_team_id, created_at DESC);

COMMENT ON INDEX shift_team_snapshots_shift_team_idx IS 'Lookup index on shift teams, by Shift Team ID';

CREATE INDEX shift_team_snapshots_region_idx ON shift_team_snapshots(
    start_timestamp_sec,
    end_timestamp_sec,
    service_region_id,
    created_at DESC
);

COMMENT ON INDEX shift_team_snapshots_region_idx IS 'Lookup index on shift teams in service region';

CREATE INDEX shift_team_snapshots_region_created_idx ON shift_team_snapshots(service_region_id, created_at DESC);

COMMENT ON INDEX shift_team_snapshots_region_created_idx IS 'Lookup index on shift teams in service region, sorted by created_at';

ALTER TABLE
    shift_team_snapshots
ADD
    CONSTRAINT shift_team_snapshots_valid_time_window CHECK (start_timestamp_sec < end_timestamp_sec);

CREATE TABLE visit_snapshots (
    id bigserial PRIMARY KEY,
    care_request_id BIGINT NOT NULL,
    service_region_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    arrival_start_timestamp_sec BIGINT,
    arrival_end_timestamp_sec BIGINT,
    service_duration_sec BIGINT NOT NULL,
    is_manual_override BOOLEAN NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE visit_snapshots IS 'Snapshots of visit data';

COMMENT ON COLUMN visit_snapshots.care_request_id IS 'Care request ID';

COMMENT ON COLUMN visit_snapshots.service_region_id IS 'Service region';

COMMENT ON COLUMN visit_snapshots.location_id IS 'Location';

COMMENT ON COLUMN visit_snapshots.arrival_start_timestamp_sec IS 'Visit arrival time window start timestamp, in seconds';

COMMENT ON COLUMN visit_snapshots.arrival_end_timestamp_sec IS 'Visit arrival time window end timestamp, in seconds';

COMMENT ON COLUMN visit_snapshots.service_duration_sec IS 'Service duration, in seconds';

CREATE INDEX visit_snapshots_care_request_idx ON visit_snapshots(care_request_id, created_at DESC);

COMMENT ON INDEX visit_snapshots_care_request_idx IS 'Lookup index on visits, by Care Request ID';

CREATE INDEX visit_snapshots_region_idx ON visit_snapshots(
    arrival_start_timestamp_sec,
    arrival_end_timestamp_sec,
    service_region_id,
    created_at DESC
);

COMMENT ON INDEX visit_snapshots_region_idx IS 'Lookup index on visits in service region';

CREATE INDEX visit_snapshots_region_created_idx ON visit_snapshots(service_region_id, created_at DESC);

COMMENT ON INDEX visit_snapshots_region_created_idx IS 'Lookup index on visits in service region, sorted by created_at';

ALTER TABLE
    visit_snapshots
ADD
    CONSTRAINT visit_snapshots_valid_arrival_time_window CHECK (
        arrival_start_timestamp_sec < arrival_end_timestamp_sec
    );

CREATE TABLE visit_phase_snapshots(
    id bigserial PRIMARY KEY,
    visit_snapshot_id BIGINT NOT NULL,
    visit_phase_type_id BIGINT NOT NULL,
    visit_phase_source_type_id BIGINT NOT NULL,
    station_user_id BIGINT,
    status_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE visit_phase_snapshots IS 'Snapshots of visit phases, 1:1 with visit_snapshots';

COMMENT ON COLUMN visit_phase_snapshots.visit_snapshot_id IS 'Visit snapshot ID for the phase';

COMMENT ON COLUMN visit_phase_snapshots.visit_phase_type_id IS 'Visit phase type';

COMMENT ON COLUMN visit_phase_snapshots.visit_phase_type_id IS 'Visit phase source type, user role who took the action';

COMMENT ON COLUMN visit_phase_snapshots.station_user_id IS 'Station User ID that added this visit phase';

COMMENT ON COLUMN visit_phase_snapshots.status_created_at IS 'Timestamp of when the care request status was created, before this row creation';

CREATE UNIQUE INDEX visit_phase_snapshots_snapshot_idx ON visit_phase_snapshots(visit_snapshot_id);

COMMENT ON INDEX visit_phase_snapshots_snapshot_idx IS 'Lookup index by 1:1 visit_snapshot_id';

CREATE TABLE shift_team_locations (
    id bigserial PRIMARY KEY,
    shift_team_snapshot_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shift_team_locations IS 'Location history for shift team snapshots';

COMMENT ON COLUMN shift_team_locations.shift_team_snapshot_id IS 'Shift team snapshot';

COMMENT ON COLUMN shift_team_locations.location_id IS 'Location';

CREATE INDEX shift_team_locations_snapshot_idx ON shift_team_locations(shift_team_snapshot_id, created_at DESC);

COMMENT ON INDEX shift_team_locations_snapshot_idx IS 'Lookup index of shift team locations';

CREATE INDEX shift_team_locations_created_idx ON shift_team_locations(created_at DESC);

COMMENT ON INDEX shift_team_locations_created_idx IS 'Lookup index of shift team locations, sorted by created_at';

CREATE TABLE attributes (
    id bigserial PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE attributes IS 'Attributes for shift teams and visits';

COMMENT ON COLUMN attributes.name IS 'Name of attribute';

CREATE UNIQUE INDEX attributes_name_idx ON attributes(name);

COMMENT ON INDEX attributes_name_idx IS 'Unique index on attribute names';

ALTER TABLE
    attributes
ADD
    CONSTRAINT attributes_unique_name UNIQUE USING INDEX attributes_name_idx;

COMMENT ON CONSTRAINT attributes_unique_name ON attributes IS 'Unique index on attribute names';

CREATE TABLE shift_team_attributes (
    id bigserial PRIMARY KEY,
    shift_team_snapshot_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shift_team_attributes IS 'Shift team attributes';

COMMENT ON COLUMN shift_team_attributes.shift_team_snapshot_id IS 'Shift team snapshot';

COMMENT ON COLUMN shift_team_attributes.attribute_id IS 'Attribute';

CREATE UNIQUE INDEX shift_team_attributes_idx ON shift_team_attributes(shift_team_snapshot_id, attribute_id);

ALTER TABLE
    shift_team_attributes
ADD
    CONSTRAINT shift_team_attributes_unique_shift_attribute UNIQUE USING INDEX shift_team_attributes_idx;

COMMENT ON CONSTRAINT shift_team_attributes_unique_shift_attribute ON shift_team_attributes IS 'Unique index on shift team attributes';

CREATE TABLE visit_attributes (
    id bigserial PRIMARY KEY,
    visit_snapshot_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    is_required BOOLEAN NOT NULL,
    is_forbidden BOOLEAN NOT NULL,
    is_preferred BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE visit_attributes IS 'Visit attributes';

COMMENT ON COLUMN visit_attributes.visit_snapshot_id IS 'Visit snapshot';

COMMENT ON COLUMN visit_attributes.attribute_id IS 'Attribute';

COMMENT ON COLUMN visit_attributes.is_required IS 'Is a required attribute';

COMMENT ON COLUMN visit_attributes.is_forbidden IS 'Is a forbidden attribute';

CREATE UNIQUE INDEX visit_attributes_idx ON visit_attributes(visit_snapshot_id, attribute_id);

ALTER TABLE
    visit_attributes
ADD
    CONSTRAINT visit_attributes_unique_visit_attribute UNIQUE USING INDEX visit_attributes_idx;

COMMENT ON CONSTRAINT visit_attributes_unique_visit_attribute ON visit_attributes IS 'Unique index on visit attributes';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE shift_team_snapshots;

DROP TABLE visit_phase_snapshots;

DROP TABLE visit_snapshots;

DROP TABLE shift_team_locations;

DROP TABLE attributes;

DROP TABLE shift_team_attributes;

DROP TABLE visit_attributes;

-- +goose StatementEnd
