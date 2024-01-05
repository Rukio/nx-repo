-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    files_result_codes
ADD
    COLUMN error_description TEXT;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    files_result_codes DROP COLUMN error_description;

-- +goose StatementEnd
