-- +goose Up
-- +goose StatementBegin
DROP TABLE provider_metrics;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
CREATE TABLE provider_metrics(
    id bigserial PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    care_requests_completed_last_seven_days INT NOT NULL,
    net_promoter_score DECIMAL NOT NULL,
    chart_closure_rate DECIMAL,
    survey_capture_rate DECIMAL,
    on_scene_time_secs BIGINT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE provider_metrics IS 'Metrics associated with providers';

COMMENT ON COLUMN provider_metrics.id IS 'The unique ID of the provider metrics record.';

COMMENT ON COLUMN provider_metrics.provider_id IS 'The ID of the provider that the metrics are associated with.';

COMMENT ON COLUMN provider_metrics.care_requests_completed_last_seven_days IS 'The number of care requests complete by the provider in the last 7 days.';

COMMENT ON COLUMN provider_metrics.net_promoter_score IS 'The median score received on the NPS survey.';

COMMENT ON COLUMN provider_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';

COMMENT ON COLUMN provider_metrics.survey_capture_rate IS 'The percentage of visits where the patient survery was captured. Applies to DHMTs only.';

COMMENT ON COLUMN provider_metrics.on_scene_time_secs IS 'The median on-scene time for completed visits in seconds.';

COMMENT ON COLUMN provider_metrics.generated_at IS 'The timestamp at which the metric was generated.';

CREATE INDEX provider_metrics_provider_id_idx ON provider_metrics(provider_id, generated_at DESC);

COMMENT ON INDEX provider_metrics_provider_id_idx IS 'Index of provider metrics provider IDs.';

-- +goose StatementEnd
