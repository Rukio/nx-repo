-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    external_care_providers
ADD
    COLUMN deleted_at TIMESTAMP WITHOUT TIME ZONE;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    external_care_providers DROP COLUMN deleted_at;

-- +goose StatementEnd
