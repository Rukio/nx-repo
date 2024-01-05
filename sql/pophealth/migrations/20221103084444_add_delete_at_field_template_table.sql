-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    templates
ADD
    COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    templates DROP COLUMN deleted_at;

-- +goose StatementEnd
