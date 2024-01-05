-- +goose Up
-- +goose StatementBegin
INSERT INTO
    provider_types(name)
VALUES
    ('PCP');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
UPDATE
    external_care_providers
SET
    provider_type_id = (
        SELECT
            id
        FROM
            provider_types
        WHERE
            provider_types.name = 'Other'
    )
WHERE
    provider_type_id IN (
        SELECT
            id
        FROM
            provider_types
        WHERE
            provider_types.name = 'PCP'
    );

DELETE FROM
    provider_types
WHERE
    name = 'PCP';

-- +goose StatementEnd
