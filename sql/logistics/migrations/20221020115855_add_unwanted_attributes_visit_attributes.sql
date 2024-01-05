-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    visit_attributes
ADD
    is_unwanted BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN visit_attributes.is_unwanted IS 'Is unwanted attribute';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    visit_attributes DROP COLUMN is_unwanted;

-- +goose StatementEnd
