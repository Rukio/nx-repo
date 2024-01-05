-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    visit_types
ADD
    COLUMN is_call_type BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN visit_types.is_call_type IS 'Flag for categorizing those types that can be applied to a call visit.';

UPDATE
    visit_types
SET
    is_call_type = TRUE
WHERE
    slug IN (
        'daily_update',
        'remote_evaluation',
        'transition_call',
        'tuck_in_call'
    );

ALTER TABLE
    visit_types
ADD
    COLUMN name TEXT;

COMMENT ON COLUMN visit_types.name IS 'Human readable name of the visit type.';

UPDATE
    visit_types
SET
    name = map.name
FROM
    (
        VALUES
            ('acute', 'Acute Care'),
            ('bridge_care_plus', 'Bridge Care Plus'),
            ('daily_update', 'Daily Update'),
            ('discharge', 'Discharge'),
            ('evaluation', 'Evaluation'),
            ('extended_care', 'Extended Care'),
            ('high_acuity', 'High Acuity'),
            ('remote_evaluation', 'Remote Evaluation'),
            ('transition_call', 'Transition Call'),
            ('tuck_in_call', 'Tuck-in Call')
    ) AS map(slug, name)
WHERE
    visit_types.slug = map.slug;

ALTER TABLE
    visit_types
ALTER COLUMN
    name
SET
    NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    visit_types DROP COLUMN is_call_type;

ALTER TABLE
    visit_types DROP COLUMN name;

-- +goose StatementEnd
