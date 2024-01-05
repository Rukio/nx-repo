-- +goose Up
-- +goose StatementBegin
CREATE TABLE public.calculated_provider_metrics (
    provider_id BIGINT UNIQUE NOT NULL,
    care_requests_completed_last_seven_days INTEGER NOT NULL,
    median_net_promoter_score NUMERIC NOT NULL,
    median_net_promoter_score_change NUMERIC NOT NULL,
    chart_closure_rate NUMERIC,
    chart_closure_rate_change NUMERIC,
    survey_capture_rate NUMERIC,
    survey_capture_rate_change NUMERIC,
    median_on_scene_time_secs BIGINT NOT NULL,
    median_on_scene_time_secs_change BIGINT NOT NULL,
    change_days INTEGER NOT NULL,
    last_care_request_completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.calculated_provider_metrics IS 'A table that houses metrics with trend calculations. Each row contains change data for each metric and one row per provider.';

COMMENT ON COLUMN public.calculated_provider_metrics.provider_id IS 'The ID of the provider that the metrics are associated with.';

COMMENT ON COLUMN public.calculated_provider_metrics.care_requests_completed_last_seven_days IS 'The number of care requests completed by the provider in the last 7 days.';

COMMENT ON COLUMN public.calculated_provider_metrics.median_net_promoter_score IS 'The median score received on the NPS survey.';

COMMENT ON COLUMN public.calculated_provider_metrics.median_net_promoter_score_change IS 'The change in the median score received on the NPS survey.';

COMMENT ON COLUMN public.calculated_provider_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';

COMMENT ON COLUMN public.calculated_provider_metrics.chart_closure_rate_change IS 'The change in the percentage of charts closed within 24 hours. Applies to APPs only.';

COMMENT ON COLUMN public.calculated_provider_metrics.survey_capture_rate IS 'The percentage of visits where the patient survery was captured. Applies to DHMTs only.';

COMMENT ON COLUMN public.calculated_provider_metrics.survey_capture_rate_change IS 'The change in the percentage of visits where the patient survey was captured. Applies to DHMTs only.';

COMMENT ON COLUMN public.calculated_provider_metrics.median_on_scene_time_secs IS 'The median on-scene time for completed visits in seconds.';

COMMENT ON COLUMN public.calculated_provider_metrics.median_on_scene_time_secs_change IS 'The change in the median on-scene time for completed visits in seconds.';

COMMENT ON COLUMN public.calculated_provider_metrics.change_days IS 'The number of days over which metric changes are.';

COMMENT ON COLUMN public.calculated_provider_metrics.last_care_request_completed_at IS 'The timestamp at which the provider completed last care request.';

CREATE INDEX calculated_provider_metrics_provider_id_idx ON public.calculated_provider_metrics (provider_id);

COMMENT ON INDEX provider_metrics_provider_id_idx IS 'Index of calculated provider metrics provider IDs.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE calculated_provider_metrics;

-- +goose StatementEnd
