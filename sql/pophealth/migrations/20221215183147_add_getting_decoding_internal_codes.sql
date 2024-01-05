-- +goose Up
-- +goose StatementBegin
INSERT INTO
    result_codes (code, code_description, code_level)
VALUES
    ('Int-12', 'getting results failed', 'file'),
    ('Int-13', 'decoding results failed', 'file');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    result_codes
WHERE
    code IN ('Int-12', 'Int-13');

-- +goose StatementEnd
