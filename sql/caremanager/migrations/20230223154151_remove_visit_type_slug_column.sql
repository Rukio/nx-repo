-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    visit_types DROP COLUMN slug;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    visit_types
ADD
    COLUMN slug TEXT;

COMMENT ON COLUMN visit_types.slug IS 'The slug of the visit type';

UPDATE
    visit_types
SET
    slug = map.slug
FROM
    (
        VALUES
            ('Acute Care', 'acute'),
            ('Bridge Care Plus', 'bridge_care_plus'),
            ('Daily Update', 'daily_update'),
            ('Discharge', 'discharge'),
            ('Evaluation', 'evaluation'),
            ('Extended Care', 'extended_care'),
            ('High Acuity', 'high_acuity'),
            ('Remote Evaluation', 'remote_evaluation'),
            ('Transition Call', 'transition_call'),
            ('Tuck-in Call', 'tuck_in_call')
    ) AS map(name, slug)
WHERE
    visit_types.name = map.name;

ALTER TABLE
    visit_types
ALTER COLUMN
    slug
SET
    NOT NULL;

-- +goose StatementEnd
