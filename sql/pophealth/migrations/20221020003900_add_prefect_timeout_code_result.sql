-- +goose Up
-- +goose StatementBegin
INSERT INTO
    result_codes (code, code_description, code_level)
VALUES
    (
        'Int-11',
        'timeout exceeded while processing file',
        'file'
    );

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    result_codes
WHERE
    code = 'Int-11';

-- +goose StatementEnd
