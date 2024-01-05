-- +goose Up
-- +goose StatementBegin
INSERT INTO
    service_lines ("id", "name", "short_name")
VALUES
    (5, 'Acute Care', 'Acute'),
    (6, 'Clinical Trial', 'Trial');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    service_lines
WHERE
    id IN (5, 6);

-- +goose StatementEnd
