-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    staging_provider_metrics
ADD
    COLUMN id BIGSERIAL PRIMARY KEY;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    staging_provider_metrics DROP COLUMN id;

-- +goose StatementEnd
