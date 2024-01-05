-- +goose Up
-- +goose StatementBegin
CREATE TABLE service_regions(
    id bigserial PRIMARY KEY,
    description TEXT NOT NULL,
    -- TODO: May need to split iana_time_zone_name into markets if a region spans multiple timezones
    iana_time_zone_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_regions IS 'Service regions are aggregated markets in a geographical region';

COMMENT ON COLUMN service_regions.description IS 'Description of the service region';

COMMENT ON COLUMN service_regions.iana_time_zone_name IS 'Time zone for service region in IANA format (https://www.iana.org/time-zones)';

CREATE TABLE markets(
    id bigserial PRIMARY KEY,
    station_market_id BIGINT NOT NULL,
    short_name TEXT NOT NULL,
    service_region_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE markets IS 'Markets in service regions';

COMMENT ON COLUMN markets.station_market_id IS 'Equivalent market ID from Station database';

COMMENT ON COLUMN markets.short_name IS 'Equivalent market short name (i.e, "DEN" for Denver) from Station database';

COMMENT ON COLUMN markets.service_region_id IS 'Service region that market belongs to';

CREATE INDEX markets_service_region_idx ON markets(service_region_id);

COMMENT ON INDEX markets_service_region_idx IS 'Lookup index of service region on markets';

CREATE INDEX markets_station_market_idx ON markets(station_market_id, created_at DESC);

COMMENT ON INDEX markets_station_market_idx IS 'Lookup index of station_market_id on markets';

CREATE TABLE service_region_open_hours_schedules(
    id bigserial PRIMARY KEY,
    service_region_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_region_open_hours_schedules IS 'Schedule of open hours for service regions';

COMMENT ON COLUMN service_region_open_hours_schedules.service_region_id IS 'Service region';

CREATE INDEX service_region_open_hours_schedules_idx ON service_region_open_hours_schedules(service_region_id, created_at DESC);

CREATE TABLE service_region_open_hours_schedule_days(
    id bigserial PRIMARY KEY,
    service_region_open_hours_schedule_id BIGINT NOT NULL,
    day_of_week INT NOT NULL,
    start_time TIME WITHOUT TIME ZONE NOT NULL,
    end_time TIME WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_region_open_hours_schedule_days IS 'Per day open hours in service region';

COMMENT ON COLUMN service_region_open_hours_schedule_days.service_region_open_hours_schedule_id IS 'Schedule for this day';

COMMENT ON COLUMN service_region_open_hours_schedule_days.day_of_week IS 'Day of week (Sunday = 0, Monday = 1, ...)';

COMMENT ON COLUMN service_region_open_hours_schedule_days.start_time IS 'Opening time on day, inclusive';

COMMENT ON COLUMN service_region_open_hours_schedule_days.end_time IS 'Closing time on day, inclusive';

CREATE UNIQUE INDEX service_region_open_hours_schedule_days_idx ON service_region_open_hours_schedule_days(
    service_region_open_hours_schedule_id,
    day_of_week
);

COMMENT ON INDEX service_region_open_hours_schedule_days_idx IS 'Unique index of weekday to schedule for open hours';

CREATE TABLE service_region_minimal_visit_durations(
    id bigserial PRIMARY KEY,
    service_region_id BIGINT NOT NULL,
    service_duration_sec BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_region_minimal_visit_durations IS 'Minimum visit durations for service regions, for checking feasibility';

COMMENT ON COLUMN service_region_minimal_visit_durations.service_region_id IS 'Service region';

COMMENT ON COLUMN service_region_minimal_visit_durations.service_duration_sec IS 'Minimal visit duration';

CREATE INDEX service_region_minimal_visit_durations_idx ON service_region_minimal_visit_durations(service_region_id, created_at DESC);

COMMENT ON INDEX service_region_minimal_visit_durations_idx IS 'Lookup index on minimum visit durations';

CREATE TABLE service_region_canonical_location_sets(
    id bigserial PRIMARY KEY,
    service_region_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_region_canonical_location_sets IS 'Sets of canonical locations for service regions';

COMMENT ON COLUMN service_region_canonical_location_sets.service_region_id IS 'Service region';

CREATE INDEX service_region_canonical_location_sets_idx ON service_region_canonical_location_sets(service_region_id, created_at DESC);

COMMENT ON INDEX service_region_canonical_location_sets_idx IS 'Lookup index on canonical locations for service regions';

CREATE TABLE service_region_canonical_locations(
    id bigserial PRIMARY KEY,
    service_region_canonical_location_set_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_region_canonical_locations IS 'Canonical location for service region';

COMMENT ON COLUMN service_region_canonical_locations.service_region_canonical_location_set_id IS 'Set of locations that this location belongs to';

COMMENT ON COLUMN service_region_canonical_locations.location_id IS 'Location';

CREATE INDEX service_region_canonical_locations_idx ON service_region_canonical_locations(service_region_canonical_location_set_id);

COMMENT ON INDEX service_region_canonical_locations_idx IS 'Lookup index of canonical locations in a set';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE service_region_open_hours_schedule_days;

DROP TABLE service_region_open_hours_schedules;

DROP TABLE markets;

DROP TABLE service_regions;

DROP TABLE service_region_minimal_visit_durations;

DROP TABLE service_region_canonical_location_sets;

DROP TABLE service_region_canonical_locations;

-- +goose StatementEnd
