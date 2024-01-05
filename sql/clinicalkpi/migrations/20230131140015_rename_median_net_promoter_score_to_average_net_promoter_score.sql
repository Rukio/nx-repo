-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    historical_provider_metrics RENAME COLUMN median_net_promoter_score TO average_net_promoter_score;

ALTER TABLE
    staging_provider_metrics RENAME COLUMN median_net_promoter_score TO average_net_promoter_score;

ALTER TABLE
    calculated_provider_metrics RENAME COLUMN median_net_promoter_score TO average_net_promoter_score;

ALTER TABLE
    calculated_provider_metrics RENAME COLUMN median_net_promoter_score_change TO average_net_promoter_score_change;

COMMENT ON COLUMN public.historical_provider_metrics.average_net_promoter_score IS 'The average score received on the NPS survey.';

COMMENT ON COLUMN public.staging_provider_metrics.average_net_promoter_score IS 'The average score received on the NPS survey.';

COMMENT ON COLUMN public.calculated_provider_metrics.average_net_promoter_score IS 'The average score received on the NPS survey.';

COMMENT ON COLUMN public.calculated_provider_metrics.average_net_promoter_score_change IS 'The change in the average score received on the NPS survey.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    historical_provider_metrics RENAME COLUMN average_net_promoter_score TO median_net_promoter_score;

ALTER TABLE
    staging_provider_metrics RENAME COLUMN average_net_promoter_score TO median_net_promoter_score;

ALTER TABLE
    calculated_provider_metrics RENAME COLUMN average_net_promoter_score TO median_net_promoter_score;

ALTER TABLE
    calculated_provider_metrics RENAME COLUMN average_net_promoter_score_change TO median_net_promoter_score_change;

COMMENT ON COLUMN public.historical_provider_metrics.median_net_promoter_score IS 'The median score received on the NPS survey.';

COMMENT ON COLUMN public.staging_provider_metrics.median_net_promoter_score IS 'The median score received on the NPS survey.';

COMMENT ON COLUMN public.calculated_provider_metrics.median_net_promoter_score IS 'The median score received on the NPS survey.';

COMMENT ON COLUMN public.calculated_provider_metrics.median_net_promoter_score_change IS 'The change in the median score received on the NPS survey.';

-- +goose StatementEnd
