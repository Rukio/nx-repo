-- +goose Up
-- +goose StatementBegin
CREATE TABLE markets(
    id bigserial PRIMARY KEY,
    market_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(market_id)
);

COMMENT ON COLUMN markets.id IS 'The unique ID of the markets record.';

COMMENT ON COLUMN markets.market_id IS 'The Station ID of the market.';

COMMENT ON COLUMN markets.name IS 'The name of the market. E.g. Denver.';

COMMENT ON COLUMN markets.short_name IS 'The short name of the market. E.g. DEN.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE markets;

-- +goose StatementEnd
