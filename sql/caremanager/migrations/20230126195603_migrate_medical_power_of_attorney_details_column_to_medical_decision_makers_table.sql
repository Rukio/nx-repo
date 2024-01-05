-- +goose Up
-- +goose StatementBegin
INSERT INTO
    medical_decision_makers(first_name, patient_id)
SELECT
    medical_power_of_attorney_details,
    id
FROM
    patients
WHERE
    medical_power_of_attorney_details IS NOT NULL
    AND medical_power_of_attorney_details <> '';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
TRUNCATE medical_decision_makers;

-- +goose StatementEnd
