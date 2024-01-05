-- +goose Up
-- +goose StatementBegin
INSERT INTO
    external_care_providers(name, provider_type_id, patient_id)
SELECT
    doctor_details,
    (
        SELECT
            id
        FROM
            provider_types
        WHERE
            name = 'Doctor'
    ),
    id
FROM
    patients
WHERE
    doctor_details IS NOT NULL
    AND doctor_details <> '';

INSERT INTO
    external_care_providers(name, provider_type_id, patient_id)
SELECT
    referrer,
    (
        SELECT
            id
        FROM
            provider_types
        WHERE
            name = 'Referrer'
    ),
    id
FROM
    patients
WHERE
    referrer IS NOT NULL
    AND referrer <> '';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
TRUNCATE external_care_providers;

-- +goose StatementEnd
