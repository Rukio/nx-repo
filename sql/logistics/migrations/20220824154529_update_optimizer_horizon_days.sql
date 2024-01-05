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
    poll_interval_sec,
    distance_validity_sec,
    5,
    optimizer_config_id,
    is_default
FROM
    optimizer_service_region_settings
WHERE
    optimize_horizon_days = 2;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    optimizer_service_region_settings
WHERE
    optimize_horizon_days = 5;

-- +goose StatementEnd
