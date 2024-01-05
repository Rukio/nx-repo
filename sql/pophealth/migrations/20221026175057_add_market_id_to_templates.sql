-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    templates
ADD
    COLUMN market_id BIGINT;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    templates DROP COLUMN market_id;

-- +goose StatementEnd
