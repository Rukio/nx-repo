-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    account_patients RENAME TO account_patient_links;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    account_patient_links RENAME TO account_patients;

-- +goose StatementEnd
