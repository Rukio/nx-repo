-- +goose Up
-- +goose StatementBegin
CREATE TABLE provider_daily_metrics (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    market_id BIGINT NOT NULL,
    service_date DATE NOT NULL,
    patients_seen INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (provider_id, market_id, service_date)
);

COMMENT ON TABLE public.provider_daily_metrics IS 'A table which contain provider metrics for a specific day and market.';

COMMENT ON COLUMN public.provider_daily_metrics.provider_id IS 'The ID of the provider that the metrics are associated with. Same as station user ID.';

COMMENT ON COLUMN public.provider_daily_metrics.market_id IS 'The ID of the market that the metrics are associated with.';

COMMENT ON COLUMN public.provider_daily_metrics.service_date IS 'Day when provider was on duty and had visits.';

COMMENT ON COLUMN public.provider_daily_metrics.patients_seen IS 'Number of patients seen by provider in a specific day.';

CREATE INDEX provider_daily_metrics_provider_service_date_idx ON provider_daily_metrics(provider_id, service_date ASC);

COMMENT ON INDEX provider_daily_metrics_provider_service_date_idx IS 'Lookup index on provider_daily_metrics by provider_id and service_date';

CREATE INDEX provider_daily_metrics_market_service_date_idx ON provider_daily_metrics(market_id, service_date ASC);

COMMENT ON INDEX provider_daily_metrics_market_service_date_idx IS 'Lookup index on provider_daily_metrics by market_id and service_date';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE provider_daily_metrics;

-- +goose StatementEnd
