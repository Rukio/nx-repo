-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    visit_summaries
ALTER COLUMN
    body
SET
    NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    visit_summaries
ALTER COLUMN
    body DROP NOT NULL;

-- +goose StatementEnd
