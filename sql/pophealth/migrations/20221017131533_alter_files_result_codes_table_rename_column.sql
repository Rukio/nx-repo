-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    files_result_codes RENAME COLUMN field TO fields;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    files_result_codes RENAME COLUMN fields TO field;

-- +goose StatementEnd
