-- +goose Up
-- +goose StatementBegin
INSERT INTO
    insurances(name, patient_id)
SELECT
    payer,
    id
FROM
    patients
WHERE
    payer IS NOT NULL
    AND payer <> '';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
TRUNCATE insurances;

-- +goose StatementEnd
