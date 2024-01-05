-- +goose Up
-- +goose StatementBegin
-- add_patient_id_to_unverified_patients.sql
-- add patient_id column to unverified_patients
ALTER TABLE
    unverified_patients
ADD
    COLUMN patient_id BIGINT;

COMMENT ON COLUMN unverified_patients.patient_id IS 'The Dispatch Health patient ID. Defined if the unverified patient is associated with a patient record.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    unverified_patients DROP COLUMN patient_id;

-- +goose StatementEnd
