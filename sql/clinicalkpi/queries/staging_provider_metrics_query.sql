-- name: AddStagingProviderMetric :one
INSERT INTO
    staging_provider_metrics (
        provider_id,
        care_requests_completed_last_seven_days,
        average_net_promoter_score,
        chart_closure_rate,
        survey_capture_rate,
        median_on_scene_time_secs,
        last_care_request_completed_at,
        completed_care_requests,
        market_ids
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;

-- name: GetAllStagingProviderMetrics :many
SELECT
    staging_provider_metrics.*
FROM
    staging_provider_metrics;

-- name: DeleteAllStagingProviderMetrics :exec
DELETE FROM
    staging_provider_metrics;

-- name: DeleteStagingProviderMetric :exec
DELETE FROM
    staging_provider_metrics
WHERE
    id = $1;
