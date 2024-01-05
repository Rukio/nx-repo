-- name: UpsertCalculatedProviderMetrics :one
INSERT INTO
    calculated_provider_metrics (
        provider_id,
        care_requests_completed_last_seven_days,
        average_net_promoter_score,
        average_net_promoter_score_change,
        chart_closure_rate,
        chart_closure_rate_change,
        survey_capture_rate,
        survey_capture_rate_change,
        median_on_scene_time_secs,
        median_on_scene_time_secs_change,
        change_days,
        last_care_request_completed_at,
        completed_care_requests
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (provider_id) DO
UPDATE
SET
    care_requests_completed_last_seven_days = EXCLUDED.care_requests_completed_last_seven_days,
    average_net_promoter_score = EXCLUDED.average_net_promoter_score,
    average_net_promoter_score_change = EXCLUDED.average_net_promoter_score_change,
    chart_closure_rate = EXCLUDED.chart_closure_rate,
    chart_closure_rate_change = EXCLUDED.chart_closure_rate_change,
    survey_capture_rate = EXCLUDED.survey_capture_rate,
    survey_capture_rate_change = EXCLUDED.survey_capture_rate_change,
    median_on_scene_time_secs = EXCLUDED.median_on_scene_time_secs,
    median_on_scene_time_secs_change = EXCLUDED.median_on_scene_time_secs_change,
    change_days = EXCLUDED.change_days,
    last_care_request_completed_at = EXCLUDED.last_care_request_completed_at,
    completed_care_requests = EXCLUDED.completed_care_requests,
    updated_at = CURRENT_TIMESTAMP RETURNING *;

-- name: GetCalculatedMetricsByProvider :one
SELECT
    calculated_provider_metrics.*
FROM
    calculated_provider_metrics
WHERE
    calculated_provider_metrics.provider_id = sqlc.arg(provider_id);

-- name: GetCalculatedMetricsForProvidersActiveAfterDate :many
SELECT
    calculated_provider_metrics.*
FROM
    calculated_provider_metrics
    INNER JOIN (
        SELECT
            unnest(sqlc.arg(provider_ids) :: BIGINT [ ]) AS id
    ) providers ON calculated_provider_metrics.provider_id = providers.id
WHERE
    last_care_request_completed_at IS NOT NULL
    AND last_care_request_completed_at > sqlc.arg(active_after);
