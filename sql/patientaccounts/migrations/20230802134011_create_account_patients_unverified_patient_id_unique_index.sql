-- +goose Up
-- +goose StatementBegin
-- create_account_patients_unverified_patient_id_unique_index.sql
-- Add unique index to unverified_patient_id column to ensure only one account is associated to an unverified patient.
CREATE UNIQUE INDEX account_patients_unverified_patient_id_uidx ON account_patients (unverified_patient_id)
WHERE
    unverified_patient_id IS NOT NULL;

COMMENT ON INDEX account_patients_unverified_patient_id_uidx IS 'Unique index to unverified_patient_id column to ensure only one account is associated to an unverified patient';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS account_patients_unverified_patient_id_uidx;

-- +goose StatementEnd
