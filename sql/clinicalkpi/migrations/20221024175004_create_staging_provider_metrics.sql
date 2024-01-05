-- +goose Up
-- +goose StatementBegin
CREATE TABLE staging_provider_metrics(
    provider_id BIGINT NOT NULL,
    care_requests_completed_last_seven_days INT NOT NULL,
    median_net_promoter_score DECIMAL NOT NULL,
    chart_closure_rate DECIMAL,
    survey_capture_rate DECIMAL,
    median_on_scene_time_secs BIGINT NOT NULL,
    last_care_request_completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE staging_provider_metrics IS 'A staging table with only new calculated metrics. Metrics will be added here until they are processed and validated.';

COMMENT ON COLUMN staging_provider_metrics.provider_id IS 'The ID of the provider that the metrics are associated with.';

COMMENT ON COLUMN staging_provider_metrics.care_requests_completed_last_seven_days IS 'The number of care requests completed by the provider in the last 7 days.';

COMMENT ON COLUMN staging_provider_metrics.median_net_promoter_score IS 'The median score received on the NPS survey.';

COMMENT ON COLUMN staging_provider_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';

COMMENT ON COLUMN staging_provider_metrics.survey_capture_rate IS 'The percentage of visits where the patient survery was captured. Applies to DHMTs only.';

COMMENT ON COLUMN staging_provider_metrics.median_on_scene_time_secs IS 'The median on-scene time for completed visits in seconds.';

COMMENT ON COLUMN staging_provider_metrics.last_care_request_completed_at IS 'The timestamp at which the provider completed last care request.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE staging_provider_metrics;

-- +goose StatementEnd
