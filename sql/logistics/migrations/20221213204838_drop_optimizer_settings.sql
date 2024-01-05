-- +goose Up
-- +goose StatementBegin
DROP TABLE optimizer_service_region_settings;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
CREATE TABLE optimizer_service_region_settings (
    id BIGINT NOT NULL,
    service_region_id BIGINT NOT NULL,
    optimizer_enabled BOOLEAN NOT NULL,
    poll_interval_sec BIGINT NOT NULL,
    distance_validity_sec BIGINT NOT NULL,
    optimize_horizon_days BIGINT NOT NULL,
    optimizer_config_id BIGINT NOT NULL,
    is_default BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    current_day_schedule_max_staleness_sec BIGINT
);

ALTER TABLE
    optimizer_service_region_settings
ADD
    CONSTRAINT optimizer_service_region_settings_unique_region_created_at UNIQUE(service_region_id, created_at);

-- +goose StatementEnd
