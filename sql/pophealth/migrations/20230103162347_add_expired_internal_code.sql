-- +goose Up
-- +goose StatementBegin
INSERT INTO
    result_codes (code, code_description, code_level)
VALUES
    ('Int-14', 'file expired', 'file');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    result_codes
WHERE
    code IN ('Int-14');

-- +goose StatementEnd
