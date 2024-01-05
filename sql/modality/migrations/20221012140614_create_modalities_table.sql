-- +goose Up
-- +goose StatementBegin
CREATE TABLE modalities(
    id bigserial PRIMARY KEY,
    display_name TEXT NOT NULL,
    modality_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO
    modalities(display_name, modality_type)
VALUES
    ('In-person', 'in_person'),
    ('Tele-presentation', 'tele_presentation');

COMMENT ON TABLE modalities IS 'Reference table for modality types';

COMMENT ON COLUMN modalities.display_name IS 'UI-visible name of modality';

COMMENT ON COLUMN modalities.modality_type IS 'Type of modality (used on back-end only)';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE modalities;

-- +goose StatementEnd
