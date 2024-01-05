-- +goose Up
-- +goose StatementBegin
INSERT INTO
    result_codes (code, code_description, code_level)
VALUES
    (
        'Int-15',
        'Request to start backfill failed',
        'file'
    );

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    result_codes
WHERE
    code IN ('Int-15');

-- +goose StatementEnd
