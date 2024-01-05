-- +goose Up
-- +goose StatementBegin
DROP TABLE IF EXISTS provider_metrics;

CREATE TABLE provider_metrics(
    id bigserial PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    on_scene_time_median_seconds INTEGER,
    chart_closure_rate FLOAT,
    survey_capture_rate FLOAT,
    net_promoter_score_average FLOAT,
    on_task_percent FLOAT,
    escalation_rate FLOAT,
    abx_prescribing_rate FLOAT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE provider_metrics IS 'Metrics associated with provider across all markets.';

COMMENT ON COLUMN provider_shifts.id IS 'The unique ID of the provider metrics record.';

COMMENT ON COLUMN provider_metrics.provider_id IS 'The Station user ID of the provider that the metrics are associated with.';

COMMENT ON COLUMN provider_metrics.on_scene_time_median_seconds IS 'The median on-scene time for completed visits in seconds.';

COMMENT ON COLUMN provider_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';

COMMENT ON COLUMN provider_metrics.survey_capture_rate IS 'The percentage of visits where the patient survey was captured. Applies to DHMTs only.';

COMMENT ON COLUMN provider_metrics.net_promoter_score_average IS 'The average score received on the NPS survey.';

COMMENT ON COLUMN provider_metrics.on_task_percent IS 'On task rate of all time "on shift" time over the last 30 days.';

COMMENT ON COLUMN provider_metrics.escalation_rate IS 'The percent of cases that were escalated.';

COMMENT ON COLUMN provider_metrics.abx_prescribing_rate IS 'The percent of cases for which antibiotics were prescribed.';

CREATE INDEX provider_metrics_provider_id_idx ON provider_metrics(provider_id);

COMMENT ON INDEX provider_metrics_provider_id_idx IS 'Index of provider metrics provider IDs.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS provider_metrics;

CREATE TABLE provider_metrics(
    provider_id BIGINT PRIMARY KEY,
    on_scene_time_average_minutes FLOAT,
    chart_closure_rate_average FLOAT,
    survey_capture_rate_average FLOAT,
    net_promoter_score_average FLOAT,
    on_task_percent_average FLOAT,
    escalation_rate_average FLOAT,
    abx_prescribing_rate_average FLOAT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE provider_metrics IS 'Metrics associated with provider across all markets.';

COMMENT ON COLUMN provider_metrics.provider_id IS 'The unique ID of the provider that the metrics are associated with.';

COMMENT ON COLUMN provider_metrics.on_scene_time_average_minutes IS 'The median on-scene time for completed visits in minutes.';

COMMENT ON COLUMN provider_metrics.chart_closure_rate_average IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';

COMMENT ON COLUMN provider_metrics.survey_capture_rate_average IS 'The percentage of visits where the patient survey was captured. Applies to DHMTs only.';

COMMENT ON COLUMN provider_metrics.net_promoter_score_average IS 'The average score received on the NPS survey.';

COMMENT ON COLUMN provider_metrics.on_task_percent_average IS 'The average time percent provider are on-tasks.';

COMMENT ON COLUMN provider_metrics.escalation_rate_average IS 'The percent of cases that were escalated.';

COMMENT ON COLUMN provider_metrics.abx_prescribing_rate_average IS 'The percent of cases antibiotics were prescribed for.';

-- +goose StatementEnd
