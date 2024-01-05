-- +goose Up
-- +goose StatementBegin
INSERT INTO
    result_codes (code, code_description, code_level)
VALUES
    ('Int-01', 'Template not found', 'file'),
    ('Int-02', 'Prefect create request failed', 'file'),
    ('Int-03', 'Prefect call failed', 'file'),
    (
        'Int-04',
        'Elastic search adds patients failed',
        'file'
    ),
    (
        'Int-05',
        'Elastic search deletes patients failed',
        'file'
    ),
    (
        'Int-06',
        'Moving file to exchange bucket failed',
        'file'
    ),
    (
        'Int-07',
        'Moving file to processed folder failed',
        'file'
    ),
    ('Int-08', 'Results file invalid', 'file');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    result_codes
WHERE
    code IN (
        'Int-01',
        'Int-02',
        'Int-03',
        'Int-04',
        'Int-05',
        'Int-06',
        'Int-07',
        'Int-08'
    );

-- +goose StatementEnd
