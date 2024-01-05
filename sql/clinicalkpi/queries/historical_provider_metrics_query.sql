-- name: AddHistoricalProviderMetric :one
INSERT INTO
    historical_provider_metrics (
        provider_id,
        care_requests_completed_last_seven_days,
        average_net_promoter_score,
        chart_closure_rate,
        survey_capture_rate,
        median_on_scene_time_secs,
        last_care_request_completed_at,
        completed_care_requests
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;

-- name: GetOldestHistoricalProviderMetricAfterDate :one
SELECT
    historical_provider_metrics.*
FROM
    historical_provider_metrics
WHERE
    provider_id = sqlc.arg(provider_id)
    AND created_at >= sqlc.arg(created_after)
ORDER BY
    created_at ASC
LIMIT
    1;
