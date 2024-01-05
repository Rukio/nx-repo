-- +goose Up
-- +goose StatementBegin
INSERT INTO
    result_codes (code, code_description, code_level)
VALUES
    ('Int-09', 'Acquiring lock failed', 'file');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    result_codes
WHERE
    code = 'Int-09';

-- +goose StatementEnd
