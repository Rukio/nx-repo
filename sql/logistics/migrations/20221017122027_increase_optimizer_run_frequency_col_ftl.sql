-- +goose Up
-- +goose StatementBegin
-- Update sequence to match table ids.
SELECT
    setval(
        'optimizer_configs_id_seq',
        COALESCE(
            (
                SELECT
                    MAX(id)
                FROM
                    optimizer_configs
            ),
            1
        )
    );

WITH new_config AS (
    INSERT INTO
        optimizer_configs (
            termination_duration_ms,
            per_visit_revenue_usd_cents,
            app_hourly_cost_usd_cents,
            dhmt_hourly_cost_usd_cents
        )
    SELECT
        1000,
        per_visit_revenue_usd_cents,
        app_hourly_cost_usd_cents,
        dhmt_hourly_cost_usd_cents
    FROM
        optimizer_configs
    WHERE
        id = 1 RETURNING *
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
    DISTINCT ON (service_region_id) service_region_id,
    optimizer_enabled,
    5,
    distance_validity_sec,
    optimize_horizon_days,
    (
        SELECT
            id
        FROM
            new_config
    ),
    is_default,
    current_day_schedule_max_staleness_sec
FROM
    optimizer_service_region_settings
WHERE
    service_region_id IN (
        SELECT
            DISTINCT ON (station_market_id) service_region_id
        FROM
            markets
        WHERE
            short_name IN ('COL', 'FTL')
        ORDER BY
            station_market_id,
            created_at DESC
    )
ORDER BY
    service_region_id,
    created_at DESC;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    optimizer_service_region_settings
WHERE
    optimizer_config_id = (
        SELECT
            id
        FROM
            optimizer_configs
        WHERE
            termination_duration_ms = 1000
        ORDER BY
            created_at DESC
        LIMIT
            1
    )
    AND service_region_id IN (
        SELECT
            DISTINCT ON (station_market_id) service_region_id
        FROM
            markets
        WHERE
            short_name IN ('COL', 'FTL')
        ORDER BY
            station_market_id,
            created_at DESC
    );

DELETE FROM
    optimizer_configs
WHERE
    id = (
        SELECT
            id
        FROM
            optimizer_configs
        WHERE
            termination_duration_ms = 1000
        ORDER BY
            created_at DESC
        LIMIT
            1
    );

-- +goose StatementEnd
