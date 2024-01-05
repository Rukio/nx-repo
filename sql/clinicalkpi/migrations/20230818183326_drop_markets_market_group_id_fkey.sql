-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    markets DROP CONSTRAINT markets_market_group_id_fkey;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    markets
ADD
    CONSTRAINT markets_market_group_id_fkey FOREIGN KEY (market_group_id) REFERENCES market_groups(market_group_id);

-- +goose StatementEnd
