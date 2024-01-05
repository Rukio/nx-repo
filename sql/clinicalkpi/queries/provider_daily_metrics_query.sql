-- name: TestAddProviderDailyMetrics :many
INSERT INTO
    provider_daily_metrics (
        provider_id,
        market_id,
        service_date,
        patients_seen,
        on_shift_duration_seconds
    )
SELECT
    unnest(sqlc.arg(provider_ids) :: BIGINT [ ]) AS provider_id,
    unnest(sqlc.arg(market_ids) :: BIGINT [ ]) AS market_id,
    unnest(sqlc.arg(service_dates) :: DATE [ ]) AS service_date,
    unnest(sqlc.arg(patients_seen_values) :: INTEGER [ ]) AS patients_seen,
    unnest(
        sqlc.arg(on_shift_duration_seconds_values) :: INTEGER [ ]
    ) AS on_shift_duration_seconds RETURNING *;

-- name: GetProviderDailyMetricsWithMarketGroupAveragesFromDate :many
WITH provider_metrics_by_market_group AS (
    SELECT
        provider_id,
        service_date,
        SUM(provider_daily_metrics.patients_seen) :: INTEGER AS patients_seen,
        markets.market_group_id
    FROM
        provider_daily_metrics
        JOIN markets ON markets.market_id = provider_daily_metrics.market_id
    WHERE
        provider_daily_metrics.provider_id = sqlc.arg(provider_id)
        AND provider_daily_metrics.service_date >= sqlc.arg(from_date)
    GROUP BY
        provider_id,
        service_date,
        markets.market_group_id
),
provider_metrics_ranked AS (
    SELECT
        provider_metrics_by_market_group.*,
        ROW_NUMBER() OVER (
            PARTITION BY provider_metrics_by_market_group.service_date
            ORDER BY
                provider_metrics_by_market_group.patients_seen DESC,
                provider_metrics_by_market_group.market_group_id ASC
        ) AS row_number
    FROM
        provider_metrics_by_market_group
)
SELECT
    provider_metrics_ranked.provider_id,
    provider_metrics_ranked.service_date,
    market_groups.market_group_id,
    market_groups.name AS market_group_name,
    provider_metrics_ranked.patients_seen,
    market_group_metrics.average_patients_seen :: NUMERIC AS market_group_average_patients_seen,
    market_group_metrics.average_on_shift_duration_seconds :: NUMERIC AS market_group_average_on_shift_duration_seconds
FROM
    provider_metrics_ranked
    JOIN market_groups ON market_groups.market_group_id = provider_metrics_ranked.market_group_id
    JOIN LATERAL (
        SELECT
            SUM(provider_daily_metrics.patients_seen) :: NUMERIC / COUNT(DISTINCT provider_daily_metrics.provider_id) AS average_patients_seen,
            SUM(provider_daily_metrics.on_shift_duration_seconds) :: NUMERIC / COUNT(DISTINCT provider_daily_metrics.provider_id) AS average_on_shift_duration_seconds
        FROM
            provider_daily_metrics
            JOIN markets ON markets.market_id = provider_daily_metrics.market_id
        WHERE
            provider_daily_metrics.service_date = provider_metrics_ranked.service_date
            AND markets.market_group_id = provider_metrics_ranked.market_group_id
    ) AS market_group_metrics ON TRUE
WHERE
    provider_metrics_ranked.row_number = 1
ORDER BY
    provider_metrics_ranked.service_date,
    market_groups.market_group_id;

-- name: TestGetProviderDailyMetricsByProviderID :many
SELECT
    *
FROM
    provider_daily_metrics
WHERE
    provider_id = sqlc.arg(provider_id)
ORDER BY
    service_date,
    market_id;

-- name: TestDeleteAllProviderDailyMetrics :exec
DELETE FROM
    provider_daily_metrics;
