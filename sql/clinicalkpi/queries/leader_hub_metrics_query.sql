-- name: GetProviderMetricsByMarket :one
WITH current_provider AS (
    SELECT
        p.provider_id,
        p.job_title
    FROM
        providers AS p
    WHERE
        p.provider_id = sqlc.arg(provider_id)
),
market_provider_rounded_metrics AS (
    SELECT
        mpm.market_id,
        mpm.provider_id,
        mpm.on_scene_time_median_seconds,
        mpm.on_scene_time_week_change_seconds,
        ROUND(CAST(mpm.chart_closure_rate AS NUMERIC), 2) AS chart_closure_rate,
        ROUND(
            CAST(mpm.chart_closure_rate_week_change AS NUMERIC),
            2
        ) AS chart_closure_rate_week_change,
        ROUND(CAST(mpm.survey_capture_rate AS NUMERIC), 2) AS survey_capture_rate,
        ROUND(
            CAST(mpm.survey_capture_rate_week_change AS NUMERIC),
            2
        ) AS survey_capture_rate_week_change,
        ROUND(CAST(mpm.net_promoter_score_average AS NUMERIC), 2) AS net_promoter_score_average,
        ROUND(
            CAST(mpm.net_promoter_score_week_change AS NUMERIC),
            2
        ) AS net_promoter_score_week_change,
        ROUND(CAST(mpm.on_task_percent AS NUMERIC), 2) AS on_task_percent,
        ROUND(CAST(mpm.on_task_percent_week_change AS NUMERIC), 2) AS on_task_percent_week_change
    FROM
        market_provider_metrics AS mpm
    WHERE
        mpm.market_id = sqlc.arg(market_id)
),
market_provider_metrics_market_rankings AS (
    SELECT
        mprm.*,
        DENSE_RANK() OVER (
            ORDER BY
                on_scene_time_median_seconds
        ) AS on_scene_time_rank,
        DENSE_RANK() OVER (
            ORDER BY
                chart_closure_rate DESC
        ) AS chart_closure_rate_rank,
        DENSE_RANK() OVER (
            ORDER BY
                survey_capture_rate DESC
        ) AS survey_capture_rate_rank,
        DENSE_RANK() OVER (
            ORDER BY
                net_promoter_score_average DESC
        ) AS net_promoter_score_rank,
        DENSE_RANK() OVER (
            ORDER BY
                on_task_percent DESC
        ) AS on_task_percent_rank,
        COUNT(*) OVER() AS total_providers
    FROM
        market_provider_rounded_metrics AS mprm
        LEFT JOIN providers AS p ON p.provider_id = mprm.provider_id
        INNER JOIN current_provider AS cp ON p.job_title = cp.job_title
)
SELECT
    *
FROM
    market_provider_metrics_market_rankings AS mpmmr
    INNER JOIN current_provider AS cp ON mpmmr.provider_id = cp.provider_id;

-- name: GetMarketMetrics :one
SELECT
    market_metrics.*,
    markets.name AS market_name,
    markets.short_name AS market_short_name
FROM
    market_metrics
    LEFT JOIN markets ON market_metrics.market_id = markets.market_id
WHERE
    market_metrics.market_id = sqlc.arg(market_id);

-- name: GetProviderShifts :many
SELECT
    ps.*,
    COUNT(*) OVER()
FROM
    provider_shifts AS ps
WHERE
    ps.provider_id = sqlc.arg(provider_id)
    AND (
        sqlc.narg(from_date) :: Date IS NULL
        OR ps.service_date >= sqlc.arg(from_date)
    )
ORDER BY
    CASE
        WHEN sqlc.arg(service_date_sort_order) :: TEXT IN('', 'DESC') THEN ps.service_date
    END DESC,
    CASE
        WHEN sqlc.arg(service_date_sort_order) :: TEXT = 'ASC' THEN ps.service_date
    END ASC
LIMIT
    sqlc.arg(limit_value) OFFSET sqlc.arg(offset_value);

-- name: GetProvidersMetricsByMarket :many
WITH market_provider_rounded_metrics AS (
    SELECT
        mpm.market_id,
        mpm.provider_id,
        mpm.on_scene_time_median_seconds,
        mpm.on_scene_time_week_change_seconds,
        ROUND(CAST(mpm.chart_closure_rate AS NUMERIC), 2) AS chart_closure_rate,
        ROUND(
            CAST(mpm.chart_closure_rate_week_change AS NUMERIC),
            2
        ) AS chart_closure_rate_week_change,
        ROUND(CAST(mpm.survey_capture_rate AS NUMERIC), 2) AS survey_capture_rate,
        ROUND(
            CAST(mpm.survey_capture_rate_week_change AS NUMERIC),
            2
        ) AS survey_capture_rate_week_change,
        ROUND(CAST(mpm.net_promoter_score_average AS NUMERIC), 2) AS net_promoter_score_average,
        ROUND(
            CAST(mpm.net_promoter_score_week_change AS NUMERIC),
            2
        ) AS net_promoter_score_week_change,
        ROUND(CAST(mpm.on_task_percent AS NUMERIC), 2) AS on_task_percent,
        ROUND(CAST(mpm.on_task_percent_week_change AS NUMERIC), 2) AS on_task_percent_week_change
    FROM
        market_provider_metrics AS mpm
        LEFT JOIN providers AS p ON mpm.provider_id = p.provider_id
    WHERE
        mpm.market_id = sqlc.arg(market_id)
        AND (
            sqlc.narg(provider_job_title) :: TEXT IS NULL
            OR p.job_title = sqlc.arg(provider_job_title)
        )
        AND (
            sqlc.arg(sort_by) :: TEXT != 'on_scene_time'
            OR mpm.on_scene_time_median_seconds IS NOT NULL
        )
        AND (
            sqlc.arg(sort_by) :: TEXT != 'chart_closure_rate'
            OR mpm.chart_closure_rate IS NOT NULL
        )
        AND (
            sqlc.arg(sort_by) :: TEXT != 'survey_capture_rate'
            OR mpm.survey_capture_rate IS NOT NULL
        )
        AND (
            sqlc.arg(sort_by) :: TEXT != 'net_promoter_score'
            OR mpm.net_promoter_score_average IS NOT NULL
        )
),
market_provider_metrics_market_rankings AS (
    SELECT
        mprm.*,
        DENSE_RANK() OVER (
            ORDER BY
                on_scene_time_median_seconds
        ) AS on_scene_time_rank,
        DENSE_RANK() OVER (
            ORDER BY
                chart_closure_rate DESC
        ) AS chart_closure_rate_rank,
        DENSE_RANK() OVER (
            ORDER BY
                survey_capture_rate DESC
        ) AS survey_capture_rate_rank,
        DENSE_RANK() OVER (
            ORDER BY
                net_promoter_score_average DESC
        ) AS net_promoter_score_rank,
        DENSE_RANK() OVER (
            ORDER BY
                on_task_percent DESC
        ) AS on_task_percent_rank
    FROM
        market_provider_rounded_metrics AS mprm
)
SELECT
    mpmmr.*,
    sqlc.embed(p),
    COUNT(*) OVER()
FROM
    market_provider_metrics_market_rankings AS mpmmr
    LEFT JOIN providers AS p ON mpmmr.provider_id = p.provider_id
WHERE
    p.id IS NOT NULL
    AND (
        sqlc.narg(search_text) :: TEXT IS NULL
        OR CONCAT_WS(' ', p.first_name, p.last_name) ILIKE CONCAT('%', sqlc.narg(search_text) :: TEXT, '%')
        OR CONCAT_WS(' ', p.last_name, p.first_name) ILIKE CONCAT('%', sqlc.narg(search_text) :: TEXT, '%')
        OR CONCAT_WS(', ', p.first_name, p.last_name) ILIKE CONCAT('%', sqlc.narg(search_text) :: TEXT, '%')
        OR CONCAT_WS(', ', p.last_name, p.first_name) ILIKE CONCAT('%', sqlc.narg(search_text) :: TEXT, '%')
    )
ORDER BY
    CASE
        WHEN sqlc.narg(sort_by) :: TEXT IS NULL THEN p.first_name
    END,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'on_scene_time' THEN mpmmr.on_scene_time_median_seconds
    END,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'chart_closure_rate' THEN mpmmr.chart_closure_rate
    END DESC,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'survey_capture_rate' THEN mpmmr.survey_capture_rate
    END DESC,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'net_promoter_score' THEN mpmmr.net_promoter_score_average
    END DESC,
    id
LIMIT
    sqlc.arg(limit_value) OFFSET sqlc.arg(offset_value);

-- name: GetProviderVisits :many
SELECT
    sqlc.embed(pv),
    COUNT(*) OVER()
FROM
    provider_visits AS pv
WHERE
    pv.provider_id = sqlc.arg(provider_id)
    AND (
        sqlc.narg(is_abx_prescribed) :: BOOLEAN IS NULL
        OR pv.is_abx_prescribed = sqlc.arg(is_abx_prescribed)
    )
    AND (
        sqlc.narg(is_escalated) :: BOOLEAN IS NULL
        OR pv.is_escalated = sqlc.arg(is_escalated)
    )
    AND (
        sqlc.narg(search_text) :: TEXT IS NULL
        OR CONCAT_WS(' ', pv.patient_first_name, pv.patient_last_name) ILIKE CONCAT('%', sqlc.narg(search_text) :: TEXT, '%')
        OR CONCAT_WS(' ', pv.patient_last_name, pv.patient_first_name) ILIKE CONCAT('%', sqlc.narg(search_text) :: TEXT, '%')
        OR CONCAT_WS(', ', pv.patient_first_name, pv.patient_last_name) ILIKE CONCAT('%', sqlc.narg(search_text) :: TEXT, '%')
        OR CONCAT_WS(', ', pv.patient_last_name, pv.patient_first_name) ILIKE CONCAT('%', sqlc.narg(search_text) :: TEXT, '%')
        OR pv.patient_athena_id ILIKE CONCAT('%', sqlc.narg(search_text) :: TEXT, '%')
    )
ORDER BY
    pv.service_date DESC
LIMIT
    sqlc.arg(limit_value) OFFSET sqlc.arg(offset_value);

-- name: GetShiftSnapshots :many
SELECT
    ss.*,
    sspt.short_name AS phase
FROM
    shift_snapshots AS ss
    LEFT JOIN shift_snapshot_phase_types AS sspt ON sspt.id = ss.shift_snapshot_phase_type_id
WHERE
    ss.shift_team_id = sqlc.arg(shift_team_id)
ORDER BY
    ss.start_timestamp;

-- name: GetProviderMetrics :one
SELECT
    provider_metrics.*,
    sqlc.embed(providers)
FROM
    provider_metrics
    LEFT JOIN providers ON provider_metrics.provider_id = providers.provider_id
WHERE
    provider_metrics.provider_id = sqlc.arg(provider_id);

-- name: TestAddProviderVisits :many
INSERT INTO
    provider_visits (
        care_request_id,
        provider_id,
        patient_first_name,
        patient_last_name,
        patient_athena_id,
        service_date,
        chief_complaint,
        diagnosis,
        is_abx_prescribed,
        abx_details,
        is_escalated,
        escalated_reason
    )
SELECT
    unnest(sqlc.arg(care_request_ids) :: BIGINT [ ]) AS care_request_id,
    unnest(sqlc.arg(provider_ids) :: BIGINT [ ]) AS provider_id,
    unnest(sqlc.arg(patient_first_names) :: TEXT [ ]) AS patient_first_name,
    unnest(sqlc.arg(patient_last_names) :: TEXT [ ]) AS patient_last_name,
    unnest(sqlc.arg(patient_athena_ids) :: TEXT [ ]) AS patient_athena_id,
    unnest(sqlc.arg(service_dates) :: DATE [ ]) AS service_date,
    unnest(sqlc.arg(chief_complaints) :: TEXT [ ]) AS chief_complaint,
    unnest(sqlc.arg(diagnosises) :: TEXT [ ]) AS diagnosis,
    unnest(sqlc.arg(is_abx_prescribeds) :: BOOLEAN [ ]) AS is_abx_prescribed,
    unnest(sqlc.arg(abx_detailses) :: TEXT [ ]) AS abx_details,
    unnest(sqlc.arg(is_escalateds) :: BOOLEAN [ ]) AS is_escalated,
    unnest(sqlc.arg(escalated_reasons) :: TEXT [ ]) AS escalated_reason RETURNING *;

-- name: TestAddMarkets :copyfrom
INSERT INTO
    markets (market_id, name, short_name, market_group_id)
VALUES
    ($1, $2, $3, $4);

-- name: TestAddMarketMetrics :many
INSERT INTO
    market_metrics (
        market_id,
        on_scene_time_median_seconds,
        on_scene_time_week_change_seconds,
        chart_closure_rate,
        chart_closure_rate_week_change,
        survey_capture_rate,
        survey_capture_rate_week_change,
        net_promoter_score_average,
        net_promoter_score_week_change
    )
SELECT
    unnest(sqlc.arg(market_ids) :: BIGINT [ ]) AS market_id,
    unnest(
        sqlc.arg(on_scene_time_median_seconds) :: INTEGER [ ]
    ) AS on_scene_time_median_seconds,
    unnest(
        sqlc.arg(on_scene_time_week_change_seconds) :: INTEGER [ ]
    ) AS on_scene_time_week_change_seconds,
    unnest(sqlc.arg(chart_closure_rates) :: FLOAT [ ]) AS chart_closure_rate,
    unnest(
        sqlc.arg(chart_closure_rate_week_changes) :: FLOAT [ ]
    ) AS chart_closure_rate_week_change,
    unnest(sqlc.arg(survey_capture_rates) :: FLOAT [ ]) AS survey_capture_rate,
    unnest(
        sqlc.arg(survey_capture_rate_week_changes) :: FLOAT [ ]
    ) AS survey_capture_rate_week_change,
    unnest(sqlc.arg(net_promoter_score_averages) :: FLOAT [ ]) AS net_promoter_score_average,
    unnest(
        sqlc.arg(net_promoter_score_week_changes) :: FLOAT [ ]
    ) AS net_promoter_score_week_change RETURNING *;

-- name: TestAddProviderShifts :many
INSERT INTO
    provider_shifts (
        shift_team_id,
        provider_id,
        service_date,
        start_time,
        end_time,
        patients_seen,
        out_the_door_duration_seconds,
        en_route_duration_seconds,
        on_scene_duration_seconds,
        on_break_duration_seconds,
        idle_duration_seconds
    )
SELECT
    unnest(sqlc.arg(shift_team_ids) :: BIGINT [ ]) AS shift_team_id,
    unnest(sqlc.arg(provider_ids) :: BIGINT [ ]) AS provider_id,
    unnest(sqlc.arg(service_dates) :: DATE [ ]) AS service_date,
    unnest(sqlc.arg(start_times) :: TIMESTAMP [ ]) AS start_time,
    unnest(sqlc.arg(end_times) :: TIMESTAMP [ ]) AS end_time,
    unnest(sqlc.arg(patients_seens) :: INTEGER [ ]) AS patients_seen,
    unnest(
        sqlc.arg(out_the_door_duration_seconds) :: INTEGER [ ]
    ) AS out_the_door_duration_seconds,
    unnest(sqlc.arg(en_route_duration_seconds) :: INTEGER [ ]) AS en_route_duration_seconds,
    unnest(sqlc.arg(on_scene_duration_seconds) :: INTEGER [ ]) AS on_scene_duration_seconds,
    unnest(sqlc.arg(on_break_duration_seconds) :: INTEGER [ ]) AS on_break_duration_seconds,
    unnest(sqlc.arg(idle_duration_seconds) :: INTEGER [ ]) AS idle_duration_seconds RETURNING *;

-- name: TestAddShiftSnapshots :many
INSERT INTO
    shift_snapshots (
        shift_team_id,
        start_timestamp,
        end_timestamp,
        shift_snapshot_phase_type_id,
        latitude_e6,
        longitude_e6
    )
SELECT
    unnest(sqlc.arg(shift_team_ids) :: BIGINT [ ]) AS shift_team_id,
    unnest(sqlc.arg(start_timestamps) :: TIMESTAMP [ ]) AS start_timestamp,
    unnest(sqlc.arg(end_timestamps) :: TIMESTAMP [ ]) AS end_timestamp,
    unnest(
        sqlc.arg(shift_snapshot_phase_type_ids) :: BIGINT [ ]
    ) AS shift_snapshot_phase_type_id,
    unnest(sqlc.arg(latitudes_e6) :: INTEGER [ ]) AS latitude_e6,
    unnest(sqlc.arg(longitudes_e6) :: INTEGER [ ]) AS longitude_e6 RETURNING *;

-- name: TestAddProviderMetrics :many
INSERT INTO
    provider_metrics (
        provider_id,
        on_scene_time_median_seconds,
        chart_closure_rate,
        survey_capture_rate,
        net_promoter_score_average,
        on_task_percent,
        escalation_rate,
        abx_prescribing_rate
    )
SELECT
    unnest(sqlc.arg(provider_ids) :: BIGINT [ ]) AS provider_id,
    unnest(
        sqlc.arg(on_scene_time_median_seconds) :: INTEGER [ ]
    ) AS on_scene_time_median_seconds,
    unnest(sqlc.arg(chart_closure_rates) :: FLOAT [ ]) AS chart_closure_rate,
    unnest(sqlc.arg(survey_capture_rates) :: FLOAT [ ]) AS survey_capture_rate,
    unnest(sqlc.arg(net_promoter_score_averages) :: FLOAT [ ]) AS net_promoter_score_average,
    unnest(sqlc.arg(on_task_percents) :: FLOAT [ ]) AS on_task_percent,
    unnest(sqlc.arg(escalation_rates) :: FLOAT [ ]) AS escalation_rate,
    unnest(sqlc.arg(abx_prescribing_rates) :: FLOAT [ ]) AS abx_prescribing_rate RETURNING *;

-- name: TestAddMarketProviderMetrics :many
INSERT INTO
    market_provider_metrics (
        provider_id,
        market_id,
        on_scene_time_median_seconds,
        on_scene_time_week_change_seconds,
        chart_closure_rate,
        chart_closure_rate_week_change,
        survey_capture_rate,
        survey_capture_rate_week_change,
        net_promoter_score_average,
        net_promoter_score_week_change,
        on_task_percent,
        on_task_percent_week_change
    )
SELECT
    unnest(sqlc.arg(provider_ids) :: BIGINT [ ]) AS provider_id,
    unnest(sqlc.arg(market_ids) :: BIGINT [ ]) AS market_id,
    unnest(
        sqlc.arg(on_scene_time_median_seconds) :: INTEGER [ ]
    ) AS on_scene_time_median_seconds,
    unnest(
        sqlc.arg(on_scene_time_week_change_seconds) :: INTEGER [ ]
    ) AS on_scene_time_week_change_seconds,
    unnest(sqlc.arg(chart_closure_rates) :: FLOAT [ ]) AS chart_closure_rate,
    unnest(
        sqlc.arg(chart_closure_rate_week_changes) :: FLOAT [ ]
    ) AS chart_closure_rate_week_change,
    unnest(sqlc.arg(survey_capture_rates) :: FLOAT [ ]) AS survey_capture_rate,
    unnest(
        sqlc.arg(survey_capture_rate_week_changes) :: FLOAT [ ]
    ) AS survey_capture_rate_week_change,
    unnest(sqlc.arg(net_promoter_score_averages) :: FLOAT [ ]) AS net_promoter_score_average,
    unnest(
        sqlc.arg(net_promoter_score_week_changes) :: FLOAT [ ]
    ) AS net_promoter_score_week_change,
    unnest(sqlc.arg(on_task_percents) :: FLOAT [ ]) AS on_task_percent,
    unnest(sqlc.arg(on_task_percent_week_changes) :: FLOAT [ ]) AS on_task_percent_week_change RETURNING *;

-- name: TestAddProviders :copyfrom
INSERT INTO
    providers (
        provider_id,
        first_name,
        last_name,
        avatar_url,
        job_title
    )
VALUES
    ($1, $2, $3, $4, $5);

-- name: TestDeleteAllMarketMetrics :exec
DELETE FROM
    market_metrics;

-- name: TestDeleteAllMarketProviderMetrics :exec
DELETE FROM
    market_provider_metrics;

-- name: TestDeleteAllProviderMetrics :exec
DELETE FROM
    provider_metrics;

-- name: TestDeleteAllProviderVisits :exec
DELETE FROM
    provider_visits;

-- name: TestDeleteAllProviderShifts :exec
DELETE FROM
    provider_shifts;

-- name: TestDeleteAllShiftSnapshots :exec
DELETE FROM
    shift_snapshots;

-- name: TestDeleteAllProviders :exec
DELETE FROM
    providers;

-- name: TestDeleteAllMarkets :exec
DELETE FROM
    markets;

-- name: TestGetMarketByID :one
SELECT
    *
FROM
    markets
WHERE
    market_id = sqlc.arg(id);

-- name: TestGetProviderMetricsByProviderID :one
SELECT
    *
FROM
    provider_metrics
WHERE
    provider_id = sqlc.arg(provider_id);

-- name: TestGetProviderVisitByCareRequestID :one
SELECT
    *
FROM
    provider_visits
WHERE
    care_request_id = sqlc.arg(care_request_id);

-- name: TestGetMarketMetricsByMarketID :one
SELECT
    *
FROM
    market_metrics
WHERE
    market_id = sqlc.arg(market_id);

-- name: TestGetProviderByProviderID :one
SELECT
    *
FROM
    providers
WHERE
    provider_id = sqlc.arg(provider_id);

-- name: TestGetMarketProviderMetricsByProviderIDAndMarketID :one
SELECT
    *
FROM
    market_provider_metrics
WHERE
    provider_id = sqlc.arg(provider_id)
    AND market_id = sqlc.arg(market_id);

-- name: TestGetProviderShiftByShiftTeamID :one
SELECT
    *
FROM
    provider_shifts
WHERE
    shift_team_id = sqlc.arg(shift_team_id);

-- name: UpdateProviderAvatars :exec
UPDATE
    providers AS p
SET
    avatar_url = CASE
        WHEN INPUT.avatar_url = '' THEN NULL
        ELSE INPUT.avatar_url
    END
FROM
    (
        SELECT
            unnest(sqlc.arg(provider_ids) :: BIGINT [ ]) AS provider_id,
            unnest(sqlc.arg(avatar_urls) :: TEXT [ ]) AS avatar_url
    ) AS INPUT
WHERE
    p.provider_id = INPUT.provider_id;

-- name: GetProviderAvatars :many
SELECT
    providers.provider_id,
    providers.avatar_url
FROM
    providers;

-- name: GetProviderMarketIDs :many
SELECT
    market_id
FROM
    market_provider_metrics
WHERE
    provider_id = sqlc.arg(provider_id);

-- name: GetProviderMarkets :many
SELECT
    markets.*
FROM
    markets
    LEFT JOIN market_provider_metrics ON markets.market_id = market_provider_metrics.market_id
WHERE
    market_provider_metrics.provider_id = sqlc.arg(provider_id);
