-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    optimizer_service_region_settings
ADD
    COLUMN current_day_schedule_max_staleness_sec BIGINT;

INSERT INTO
    optimizer_service_region_settings (
        service_region_id,
        optimizer_enabled,
        poll_interval_sec,
        distance_validity_sec,
        optimize_horizon_days,
        optimizer_config_id,
        is_default,
        current_day_schedule_max_staleness_sec
    )
SELECT
    DISTINCT ON (service_region_id) service_region_id,
    optimizer_enabled,
    poll_interval_sec,
    distance_validity_sec,
    optimize_horizon_days,
    optimizer_config_id,
    is_default,
    60
FROM
    optimizer_service_region_settings
WHERE
    current_day_schedule_max_staleness_sec IS NULL
ORDER BY
    service_region_id,
    created_at DESC;

COMMENT ON COLUMN optimizer_service_region_settings.current_day_schedule_max_staleness_sec IS 'Number of seconds after which the optimizer should run on a region for the current day schedule even if no underlying data has changed';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    optimizer_service_region_settings
WHERE
    current_day_schedule_max_staleness_sec IS NOT NULL;

ALTER TABLE
    optimizer_service_region_settings DROP COLUMN current_day_schedule_max_staleness_sec;

-- +goose StatementEnd
