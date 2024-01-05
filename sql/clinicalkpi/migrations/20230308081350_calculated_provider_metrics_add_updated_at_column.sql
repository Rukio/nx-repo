-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    calculated_provider_metrics
ADD
    COLUMN updated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN calculated_provider_metrics.updated_at IS 'The time at which the metrics row was last updated';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    calculated_provider_metrics DROP COLUMN updated_at;

-- +goose StatementEnd
