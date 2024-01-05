-- +goose Up
-- +goose StatementBegin
CREATE TABLE markets_active_providers(
    provider_id BIGINT NOT NULL,
    market_id BIGINT NOT NULL,
    UNIQUE(provider_id, market_id)
);

COMMENT ON TABLE markets_active_providers IS 'Mapping table for markets to providers active in those markets.';

CREATE INDEX markets_active_providers_provider_id_idx ON markets_active_providers(provider_id);

COMMENT ON INDEX markets_active_providers_provider_id_idx IS 'Lookup index on markets_active_providers by provider ID';

CREATE INDEX markets_active_providers_market_id_idx ON markets_active_providers(market_id);

COMMENT ON INDEX markets_active_providers_market_id_idx IS 'Lookup index on markets_active_providers by market ID';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE markets_active_providers;

-- +goose StatementEnd
