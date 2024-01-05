-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurances
ADD
    COLUMN deleted_at TIMESTAMP WITHOUT TIME ZONE;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurances DROP COLUMN deleted_at;

-- +goose StatementEnd
