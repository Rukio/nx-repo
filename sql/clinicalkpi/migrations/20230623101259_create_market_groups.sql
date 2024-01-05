-- +goose Up
-- +goose StatementBegin
CREATE TABLE market_groups(
    id bigserial PRIMARY KEY,
    market_group_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(market_group_id)
);

COMMENT ON TABLE market_groups IS 'A table which contains information about market groups from Redshift.';

COMMENT ON COLUMN market_groups.id IS 'The unique ID of the market group record.';

COMMENT ON COLUMN market_groups.market_group_id IS 'The Redshift ID of the market group.';

COMMENT ON COLUMN market_groups.name IS 'The name of the market group. E.g. Denver|Colorado Springs.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE market_groups;

-- +goose StatementEnd
