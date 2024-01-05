-- +goose Up
-- +goose StatementBegin
WITH default_settings AS (
    SELECT
        DISTINCT ON (is_default) *
    FROM
        optimizer_service_region_settings
    WHERE
        is_default
    ORDER BY
        is_default,
        created_at DESC
),
service_region_ids AS (
    SELECT
        DISTINCT ON (station_market_id) service_region_id
    FROM
        markets
    WHERE
        short_name IN ('BIL', 'BOI', 'FTM', 'POR')
    ORDER BY
        station_market_id,
        created_at DESC
)
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
    service_region_ids.service_region_id,
    TRUE,
    default_settings.poll_interval_sec,
    default_settings.distance_validity_sec,
    default_settings.optimize_horizon_days,
    default_settings.optimizer_config_id,
    FALSE,
    default_settings.current_day_schedule_max_staleness_sec
FROM
    default_settings
    CROSS JOIN service_region_ids;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    optimizer_service_region_settings
WHERE
    id IN (
        SELECT
            DISTINCT ON (service_region_id) id
        FROM
            optimizer_service_region_settings
        WHERE
            service_region_id IN (
                SELECT
                    DISTINCT ON (station_market_id) service_region_id
                FROM
                    markets
                WHERE
                    short_name IN ('BIL', 'BOI', 'FTM', 'POR')
                ORDER BY
                    station_market_id,
                    created_at DESC
            )
        ORDER BY
            service_region_id,
            created_at DESC
    );

-- +goose StatementEnd
