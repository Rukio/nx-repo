-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    provider_daily_metrics
ADD
    COLUMN on_shift_duration_seconds INTEGER NOT NULL;

COMMENT ON COLUMN provider_daily_metrics.on_shift_duration_seconds IS 'Total duration of all of the provider''s shifts in market for the service date.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    provider_daily_metrics DROP COLUMN on_shift_duration_seconds;

-- +goose StatementEnd
