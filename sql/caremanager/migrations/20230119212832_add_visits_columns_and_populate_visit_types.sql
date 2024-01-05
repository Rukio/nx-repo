-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    visits
ADD
    COLUMN created_by_user_id BIGINT,
ADD
    COLUMN status TEXT,
ADD
    COLUMN status_updated_at TIMESTAMP WITHOUT TIME ZONE,
ADD
    COLUMN address_id BIGINT,
ADD
    COLUMN patient_availability_start TIMESTAMP WITHOUT TIME ZONE,
ADD
    COLUMN patient_availability_end TIMESTAMP WITHOUT TIME ZONE,
ADD
    COLUMN car_name TEXT,
ADD
    COLUMN provider_user_ids BIGINT [ ];

COMMENT ON COLUMN visits.created_by_user_id IS 'The id of the user who created the visit';

COMMENT ON COLUMN visits.status IS 'The status of the visit, it is free text that comes from an external source';

COMMENT ON COLUMN visits.status_updated_at IS 'The point in time when the status was updated';

COMMENT ON COLUMN visits.address_id IS 'The id of the visit address';

COMMENT ON COLUMN visits.patient_availability_start IS 'Point in time when the patient availability starts';

COMMENT ON COLUMN visits.patient_availability_end IS 'Point in time when the patient availability ends';

COMMENT ON COLUMN visits.car_name IS 'The name of the car assigned to the visit';

COMMENT ON COLUMN visits.provider_user_ids IS 'A list of the providers user ids';

INSERT INTO
    visit_types (slug)
VALUES
    ('acute'),
    ('bridge_care_plus'),
    ('daily_update'),
    ('discharge'),
    ('evaluation'),
    ('extended_care'),
    ('high_acuity'),
    ('remote_evaluation'),
    ('transition_call'),
    ('tuck_in_call');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    visits DROP COLUMN created_by_user_id,
    DROP COLUMN status,
    DROP COLUMN status_updated_at,
    DROP COLUMN address_id,
    DROP COLUMN patient_availability_start,
    DROP COLUMN patient_availability_end,
    DROP COLUMN car_name,
    DROP COLUMN provider_user_ids;

UPDATE
    visits
SET
    visit_type_id = NULL
WHERE
    visit_type_id IN (
        SELECT
            id
        FROM
            visit_types
        WHERE
            slug IN (
                'acute',
                'bridge_care_plus',
                'daily_update',
                'discharge',
                'evaluation',
                'extended_care',
                'high_acuity',
                'remote_evaluation',
                'transition_call',
                'tuck_in_call'
            )
    );

DELETE FROM
    visit_types
WHERE
    slug IN (
        'acute',
        'bridge_care_plus',
        'daily_update',
        'discharge',
        'evaluation',
        'extended_care',
        'high_acuity',
        'remote_evaluation',
        'transition_call',
        'tuck_in_call'
    );

-- +goose StatementEnd
