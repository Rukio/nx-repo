-- +goose Up
-- +goose StatementBegin
INSERT INTO
    pharmacies(name, patient_id)
SELECT
    preferred_pharmacy_details,
    id
FROM
    patients
WHERE
    preferred_pharmacy_details IS NOT NULL
    AND preferred_pharmacy_details <> '';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
TRUNCATE pharmacies;

-- +goose StatementEnd
