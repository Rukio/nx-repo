-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    market_metrics
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE
    market_provider_metrics
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE
    provider_metrics
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE
    provider_visits
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE
    provider_shifts
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE
    shift_snapshots
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE
    providers
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

ALTER TABLE
    markets
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    market_metrics
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE
    market_provider_metrics
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE
    provider_metrics
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE
    provider_visits
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE
    provider_shifts
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE
    shift_snapshots
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE
    providers
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE
    markets
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITHOUT TIME ZONE;

-- +goose StatementEnd
