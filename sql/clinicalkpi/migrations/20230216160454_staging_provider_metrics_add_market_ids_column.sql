-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    staging_provider_metrics
ADD
    COLUMN market_ids TEXT;

COMMENT ON COLUMN staging_provider_metrics.market_ids IS 'A pipe-delimited string of unique market IDs in which the care requests used to calculated the metrics were completed';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    staging_provider_metrics DROP COLUMN market_ids;

-- +goose StatementEnd
