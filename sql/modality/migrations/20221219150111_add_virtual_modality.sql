-- +goose Up
-- +goose StatementBegin
UPDATE
    modalities
SET
    display_name = 'Virtual',
    modality_type = 'virtual',
    updated_at = now()
WHERE
    modality_type = 'tele_presentation';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
UPDATE
    modalities
SET
    display_name = 'Tele-presentation',
    modality_type = 'tele_presentation',
    updated_at = now()
WHERE
    modality_type = 'virtual';

-- +goose StatementEnd
