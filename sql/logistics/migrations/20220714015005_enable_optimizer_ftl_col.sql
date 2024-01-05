-- +goose Up
-- +goose StatementBegin
INSERT INTO
    optimizer_service_region_settings(
        service_region_id,
        optimizer_enabled,
        poll_interval_sec,
        distance_validity_sec,
        optimize_horizon_days,
        optimizer_config_id,
        is_default
    )
SELECT
    markets.service_region_id,
    TRUE,
    1 * 60,
    86400,
    2,
    1,
    FALSE
FROM
    markets
WHERE
    short_name IN ('TES', 'FTL', 'COL')
ORDER BY
    created_at DESC;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    optimizer_service_region_settings
WHERE
    id IN (
        SELECT
            optimizer_service_region_settings.id
        FROM
            optimizer_service_region_settings
            JOIN service_regions ON service_regions.id = optimizer_service_region_settings.service_region_id
            JOIN markets ON markets.service_region_id = service_regions.id
        WHERE
            markets.short_name IN ('TES', 'FTL', 'COL')
        ORDER BY
            optimizer_service_region_settings.created_at DESC
    );

-- +goose StatementEnd
