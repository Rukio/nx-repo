-- +goose Up
-- +goose StatementBegin
CREATE TABLE optimizer_configs(
    id bigserial PRIMARY KEY,
    termination_duration_ms BIGINT NOT NULL,
    per_visit_revenue_usd_cents BIGINT NOT NULL,
    app_hourly_cost_usd_cents BIGINT NOT NULL,
    dhmt_hourly_cost_usd_cents BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE optimizer_configs IS 'Configuration values for optimizer';

COMMENT ON COLUMN optimizer_configs.termination_duration_ms IS 'Time limit for running the optimizer, in milliseconds';

COMMENT ON COLUMN optimizer_configs.per_visit_revenue_usd_cents IS 'Per visit revenue, in USD cents';

COMMENT ON COLUMN optimizer_configs.app_hourly_cost_usd_cents IS 'APP hourly cost, in USD cents';

COMMENT ON COLUMN optimizer_configs.dhmt_hourly_cost_usd_cents IS 'DHMT hourly cost, in USD cents';

CREATE TABLE optimizer_service_region_settings(
    id bigserial PRIMARY KEY,
    service_region_id BIGINT NOT NULL,
    optimizer_enabled BOOLEAN NOT NULL,
    poll_interval_sec BIGINT NOT NULL,
    distance_validity_sec BIGINT NOT NULL,
    optimize_horizon_days BIGINT NOT NULL,
    optimizer_config_id BIGINT NOT NULL,
    is_default BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE optimizer_service_region_settings IS 'Per service region optimizer settings';

COMMENT ON COLUMN optimizer_service_region_settings.service_region_id IS 'Service region';

COMMENT ON COLUMN optimizer_service_region_settings.optimizer_enabled IS 'Optimizer enabled for service region';

COMMENT ON COLUMN optimizer_service_region_settings.poll_interval_sec IS 'Poll interval for new information in service region';

COMMENT ON COLUMN optimizer_service_region_settings.distance_validity_sec IS 'Validity of distance data, in seconds';

COMMENT ON COLUMN optimizer_service_region_settings.optimize_horizon_days IS 'Number of days forward to optimize for, including current day';

COMMENT ON COLUMN optimizer_service_region_settings.optimizer_config_id IS 'Optimizer config to use when optimizing';

COMMENT ON COLUMN optimizer_service_region_settings.is_default IS 'Default flag. Only the latest default settings is used for new service regions';

CREATE INDEX optimizer_service_region_settings_service_region_idx ON optimizer_service_region_settings(service_region_id, created_at DESC);

COMMENT ON INDEX optimizer_service_region_settings_service_region_idx IS 'Lookup index on optimizer settings by service region';

CREATE INDEX optimizer_service_region_settings_is_default_idx ON optimizer_service_region_settings(is_default, created_at DESC);

COMMENT ON INDEX optimizer_service_region_settings_is_default_idx IS 'Lookup index of default service region settings';

CREATE TABLE optimizer_runs(
    id bigserial PRIMARY KEY,
    service_region_id BIGINT NOT NULL,
    service_date date NOT NULL,
    open_hours_schedule_day_id BIGINT NOT NULL,
    open_hours_start_timestamp_sec BIGINT NOT NULL,
    open_hours_end_timestamp_sec BIGINT NOT NULL,
    earliest_distance_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    latest_distance_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    snapshot_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    optimizer_config_id BIGINT NOT NULL,
    service_version TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE optimizer_runs IS 'Optimizer run history';

COMMENT ON COLUMN optimizer_runs.service_region_id IS 'Service region';

COMMENT ON COLUMN optimizer_runs.service_date IS 'Service date';

COMMENT ON COLUMN optimizer_runs.open_hours_schedule_day_id IS 'Opening hours schedule day';

COMMENT ON COLUMN optimizer_runs.open_hours_start_timestamp_sec IS 'Opening hours start timestamp, in seconds';

COMMENT ON COLUMN optimizer_runs.open_hours_end_timestamp_sec IS 'Opening hours end timestamp, in seconds';

COMMENT ON COLUMN optimizer_runs.earliest_distance_timestamp IS 'Earliest distance timestamp';

COMMENT ON COLUMN optimizer_runs.latest_distance_timestamp IS 'Latest distance timestamp';

COMMENT ON COLUMN optimizer_runs.snapshot_timestamp IS 'Snapshot timestamp used for collecting data for the run';

COMMENT ON COLUMN optimizer_runs.optimizer_config_id IS 'Optimizer config used';

COMMENT ON COLUMN optimizer_runs.service_version IS 'Version of Logistics/Go used to invoke the optimizer';

CREATE INDEX optimizer_runs_service_region_date_idx ON optimizer_runs(service_region_id, service_date, created_at DESC);

COMMENT ON INDEX optimizer_runs_service_region_date_idx IS 'Lookup index on optimizer runs by service region and date';

CREATE TABLE schedules(
    id bigserial PRIMARY KEY,
    service_region_id BIGINT NOT NULL,
    optimizer_run_id BIGINT NOT NULL,
    hard_score BIGINT NOT NULL,
    unassigned_visits_score BIGINT NOT NULL,
    soft_score BIGINT NOT NULL,
    optimizer_version TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE schedules IS 'Schedules generated by optimizer runs';

COMMENT ON COLUMN schedules.service_region_id IS 'Service region';

COMMENT ON COLUMN schedules.optimizer_run_id IS 'Optimizer run used to produce this schedule';

COMMENT ON COLUMN schedules.hard_score IS 'Hard score';

COMMENT ON COLUMN schedules.unassigned_visits_score IS 'Score for unassigned visits';

COMMENT ON COLUMN schedules.soft_score IS 'Soft score';

COMMENT ON COLUMN schedules.optimizer_version IS 'Optimizer version used to produce this schedule';

CREATE INDEX schedule_service_region_idx ON schedules(service_region_id, created_at DESC);

COMMENT ON INDEX schedule_service_region_idx IS 'Lookups of schedules by service region';

CREATE INDEX schedule_optimizer_run_idx ON schedules(optimizer_run_id, created_at DESC);

COMMENT ON INDEX schedule_optimizer_run_idx IS 'Lookups of schedules by optimizer run';

CREATE TABLE schedule_routes(
    id bigserial PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    shift_team_snapshot_id BIGINT NOT NULL,
    depot_arrival_timestamp_sec BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE schedule_routes IS 'Routes for shift teams in a schedule';

COMMENT ON COLUMN schedule_routes.schedule_id IS 'Schedule this route belongs to';

COMMENT ON COLUMN schedule_routes.shift_team_snapshot_id IS 'Source shift team snapshot';

COMMENT ON COLUMN schedule_routes.depot_arrival_timestamp_sec IS 'Time the shift team should arrive back at the depot';

CREATE UNIQUE INDEX schedule_route_shift_teams_unique_idx ON schedule_routes(schedule_id, shift_team_snapshot_id);

COMMENT ON INDEX schedule_route_shift_teams_unique_idx IS 'Unique index of shift teams on a route';

CREATE TABLE schedule_visits(
    id bigserial PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    schedule_route_id BIGINT NOT NULL,
    visit_snapshot_id BIGINT NOT NULL,
    arrival_timestamp_sec BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE schedule_visits IS 'Visits for routes on a schedule';

COMMENT ON COLUMN schedule_visits.schedule_id IS 'Schedule this visit belongs to';

COMMENT ON COLUMN schedule_visits.schedule_route_id IS 'Route this visit belongs to';

COMMENT ON COLUMN schedule_visits.visit_snapshot_id IS 'Source visit snapshot';

COMMENT ON COLUMN schedule_visits.arrival_timestamp_sec IS 'Arrival timestamp, in seconds';

CREATE INDEX schedule_visit_idx ON schedule_visits(visit_snapshot_id);

COMMENT ON INDEX schedule_visit_idx IS 'Index of visit snapshots in schedule visits';

CREATE INDEX schedule_visit_schedule_idx ON schedule_visits(schedule_id);

COMMENT ON INDEX schedule_visit_schedule_idx IS 'Index of schedule in schedule visits';

CREATE TABLE unassigned_schedule_visits(
    id bigserial PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    visit_snapshot_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE unassigned_schedule_visits IS 'Known unassigned visits on a schedule. These are accepted visits that the optimizer could not fit into a feasible schedule, but will keep trying. If the situation persists, manual intervention may be needed.';

COMMENT ON COLUMN unassigned_schedule_visits.schedule_id IS 'Schedule this unassigned visit belongs to';

COMMENT ON COLUMN unassigned_schedule_visits.visit_snapshot_id IS 'Source visit snapshot';

CREATE INDEX unassigned_schedule_visit_schedule_idx ON unassigned_schedule_visits(schedule_id);

CREATE TABLE schedule_stats(
    id bigserial PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    drive_duration_sec BIGINT,
    drive_distance_meters BIGINT,
    service_duration_sec BIGINT
);

COMMENT ON TABLE schedule_stats IS 'Stats for a schedule';

COMMENT ON COLUMN schedule_stats.schedule_id IS 'Associated schedule';

COMMENT ON COLUMN schedule_stats.drive_duration_sec IS 'Total driving duration, in seconds';

COMMENT ON COLUMN schedule_stats.drive_distance_meters IS 'Total driving distance, in meters';

COMMENT ON COLUMN schedule_stats.service_duration_sec IS 'Total service duration, in seconds';

CREATE UNIQUE INDEX schedule_stats_schedule_idx ON schedule_stats(schedule_id);

COMMENT ON INDEX schedule_stats_schedule_idx IS 'Lookup index of stats for a schedule';

CREATE TABLE visit_phase_types(
    id bigserial PRIMARY KEY,
    short_name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE visit_phase_types IS 'Types of visit phases';

COMMENT ON COLUMN visit_phase_types.short_name IS 'Short name of the visit phase type';

COMMENT ON COLUMN visit_phase_types.description IS 'Description of the visit phase type';

CREATE UNIQUE INDEX visit_phase_types_short_name_idx ON visit_phase_types(short_name);

COMMENT ON INDEX visit_phase_types_short_name_idx IS 'Lookup index for short names for visit phases';

INSERT INTO
    visit_phase_types(id, short_name, description)
VALUES
    (1, 'uncommitted', 'Uncommitted'),
    (2, 'committed', 'Committed'),
    (3, 'en_route', 'En Route'),
    (4, 'on_scene', 'On Scene'),
    (5, 'completed', 'Completed'),
    (6, 'cancelled', 'Cancelled'),
    (7, 'requested', 'Requested');

CREATE TABLE visit_phase_source_types(
    id bigserial PRIMARY KEY,
    short_name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE visit_phase_source_types IS 'Source types of visit phase information';

COMMENT ON COLUMN visit_phase_source_types.short_name IS 'Short name of the visit phase source type';

COMMENT ON COLUMN visit_phase_source_types.description IS 'Description of the visit phase source type';

CREATE UNIQUE INDEX visit_phase_source_types_short_name_idx ON visit_phase_source_types(short_name);

COMMENT ON INDEX visit_phase_source_types_short_name_idx IS 'Lookup index for short names for visit phase source types';

INSERT INTO
    visit_phase_source_types(id, short_name, description)
VALUES
    (1, 'manual_optimizer', 'Manual Optimizer'),
    (2, 'provider', 'Provider'),
    (
        3,
        'logistics_elixir_auto_assignment',
        'Logistics Elixir Automatic Assignment'
    ),
    (4, 'other', 'Other');

INSERT INTO
    optimizer_configs(
        id,
        termination_duration_ms,
        per_visit_revenue_usd_cents,
        app_hourly_cost_usd_cents,
        dhmt_hourly_cost_usd_cents
    )
VALUES
    (1, 10000, 25000, 8700, 2500);

INSERT INTO
    optimizer_service_region_settings(
        is_default,
        service_region_id,
        optimizer_enabled,
        poll_interval_sec,
        distance_validity_sec,
        optimize_horizon_days,
        optimizer_config_id
    )
VALUES
    (TRUE, -1, FALSE, 60, 86400, 2, 1);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE optimizer_configs;

DROP TABLE optimizer_service_region_settings;

DROP TABLE optimizer_runs;

DROP TABLE schedules;

DROP TABLE schedule_routes;

DROP TABLE schedule_visits;

DROP TABLE unassigned_schedule_visits;

DROP TABLE schedule_stats;

DROP TABLE visit_phase_types;

DROP TABLE visit_phase_source_types;

-- +goose StatementEnd
