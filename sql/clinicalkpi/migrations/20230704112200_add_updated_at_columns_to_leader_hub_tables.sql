-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    market_metrics
ADD
    COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE
    market_provider_metrics
ADD
    COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE
    provider_metrics
ADD
    COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE
    provider_visits
ADD
    COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE
    provider_shifts
ADD
    COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE
    shift_snapshots
ADD
    COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE
    providers
ADD
    COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE
    markets
ADD
    COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    market_metrics DROP COLUMN updated_at;

ALTER TABLE
    market_provider_metrics DROP COLUMN updated_at;

ALTER TABLE
    provider_metrics DROP COLUMN updated_at;

ALTER TABLE
    provider_visits DROP COLUMN updated_at;

ALTER TABLE
    provider_shifts DROP COLUMN updated_at;

ALTER TABLE
    shift_snapshots DROP COLUMN updated_at;

ALTER TABLE
    providers DROP COLUMN updated_at;

ALTER TABLE
    markets DROP COLUMN updated_at;

-- +goose StatementEnd
