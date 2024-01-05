-- +goose Up
-- +goose StatementBegin
INSERT INTO
    optimizer_service_region_settings (
        service_region_id,
        optimizer_enabled,
        poll_interval_sec,
        distance_validity_sec,
        optimize_horizon_days,
        optimizer_config_id,
        is_default
    )
SELECT
    service_region_id,
    optimizer_enabled,
    20,
    distance_validity_sec,
    optimize_horizon_days,
    optimizer_config_id,
    is_default
FROM
    optimizer_service_region_settings
WHERE
    poll_interval_sec = 60
    AND optimize_horizon_days = 5;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    optimizer_service_region_settings
WHERE
    poll_interval_sec = 20
    AND optimize_horizon_days = 5;

-- +goose StatementEnd
