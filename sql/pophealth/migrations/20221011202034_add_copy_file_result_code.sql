-- +goose Up
-- +goose StatementBegin
INSERT INTO
    result_codes (code, code_description, code_level)
VALUES
    (
        'Int-10',
        'failed to copy the file to exchange bucket',
        'file'
    );

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    result_codes
WHERE
    code = 'Int-10';

-- +goose StatementEnd
