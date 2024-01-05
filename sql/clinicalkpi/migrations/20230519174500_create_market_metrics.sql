-- +goose Up
-- +goose StatementBegin
CREATE TABLE market_metrics(
    id bigserial PRIMARY KEY,
    market_id BIGINT NOT NULL,
    on_scene_time_median_seconds INTEGER,
    on_scene_time_week_change_seconds INTEGER,
    chart_closure_rate FLOAT,
    chart_closure_rate_week_change FLOAT,
    survey_capture_rate FLOAT,
    survey_capture_rate_week_change FLOAT,
    net_promoter_score_average FLOAT,
    net_promoter_score_week_change FLOAT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE market_metrics IS 'Metrics associated with markets.';

COMMENT ON COLUMN market_metrics.id IS 'The unique ID of the market metrics record.';

COMMENT ON COLUMN market_metrics.market_id IS 'The unique ID of the market that the metrics are associated with.';

COMMENT ON COLUMN market_metrics.on_scene_time_median_seconds IS 'The median on-scene time for completed visits in seconds.';

COMMENT ON COLUMN market_metrics.on_scene_time_week_change_seconds IS 'Change of the median on-scene time for completed visits in seconds metric in the last 7 days.';

COMMENT ON COLUMN market_metrics.chart_closure_rate IS 'The percentage of charts closed within 24 hours. Applies to APPs only.';

COMMENT ON COLUMN market_metrics.chart_closure_rate_week_change IS 'Change of the percentage of charts closed within 24 hours metric in the last 7 days. Applies to APPs only.';

COMMENT ON COLUMN market_metrics.survey_capture_rate IS 'The percentage of visits where the patient survey was captured. Applies to DHMTs only.';

COMMENT ON COLUMN market_metrics.survey_capture_rate_week_change IS 'Change of the percentage of visits where the patient survey was captured metric in the last 7 days. Applies to DHMTs only.';

COMMENT ON COLUMN market_metrics.net_promoter_score_average IS 'The average score received on the NPS survey.';

COMMENT ON COLUMN market_metrics.net_promoter_score_week_change IS 'Change of the average score received on the NPS survey metric in the last 7 days.';

CREATE UNIQUE INDEX market_metrics_market_id_idx ON market_metrics(market_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS market_metrics;

-- +goose StatementEnd
