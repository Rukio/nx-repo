-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    staging_provider_metrics
ADD
    completed_care_requests INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN staging_provider_metrics.completed_care_requests IS 'The total number of care requests completed by the provider.';

ALTER TABLE
    historical_provider_metrics
ADD
    completed_care_requests INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN historical_provider_metrics.completed_care_requests IS 'The total number of care requests completed by the provider.';

ALTER TABLE
    calculated_provider_metrics
ADD
    completed_care_requests INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN calculated_provider_metrics.completed_care_requests IS 'The total number of care requests completed by the provider.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    staging_provider_metrics DROP COLUMN completed_care_requests;

ALTER TABLE
    historical_provider_metrics DROP COLUMN completed_care_requests;

ALTER TABLE
    calculated_provider_metrics DROP COLUMN completed_care_requests;

-- +goose StatementEnd
