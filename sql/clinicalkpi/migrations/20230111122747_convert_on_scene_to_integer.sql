-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    historical_provider_metrics
ALTER COLUMN
    median_on_scene_time_secs TYPE INTEGER;

ALTER TABLE
    staging_provider_metrics
ALTER COLUMN
    median_on_scene_time_secs TYPE INTEGER;

ALTER TABLE
    calculated_provider_metrics
ALTER COLUMN
    median_on_scene_time_secs TYPE INTEGER,
ALTER COLUMN
    median_on_scene_time_secs_change TYPE INTEGER;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    historical_provider_metrics
ALTER COLUMN
    median_on_scene_time_secs TYPE BIGINT;

ALTER TABLE
    staging_provider_metrics
ALTER COLUMN
    median_on_scene_time_secs TYPE BIGINT;

ALTER TABLE
    calculated_provider_metrics
ALTER COLUMN
    median_on_scene_time_secs TYPE BIGINT,
ALTER COLUMN
    median_on_scene_time_secs_change TYPE BIGINT;

-- +goose StatementEnd
