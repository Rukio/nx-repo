-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    templates
ALTER COLUMN
    market_id
SET
    NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    templates
ALTER COLUMN
    market_id DROP NOT NULL;

-- +goose StatementEnd
