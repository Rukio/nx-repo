-- +goose Up
-- +goose StatementBegin
INSERT INTO
    modalities(display_name, modality_type)
VALUES
    ('Telepresentation', 'telepresentation');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    modality_configurations
WHERE
    modality_id = (
        SELECT
            id
        FROM
            modalities
        WHERE
            modality_type = 'telepresentation'
    );

DELETE FROM
    modalities
WHERE
    display_name = 'Telepresentation'
    AND modality_type = 'telepresentation';

-- +goose StatementEnd
