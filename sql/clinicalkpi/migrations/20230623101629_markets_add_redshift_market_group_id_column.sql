-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    markets
ADD
    COLUMN market_group_id BIGINT;

COMMENT ON COLUMN markets.market_group_id IS 'The Redshift ID of the market group.';

ALTER TABLE
    markets
ADD
    CONSTRAINT markets_market_group_id_fkey FOREIGN KEY (market_group_id) REFERENCES market_groups(market_group_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    markets DROP COLUMN market_group_id;

-- +goose StatementEnd
