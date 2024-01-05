-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    episodes
ADD
    CONSTRAINT episodes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients (id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    episodes DROP CONSTRAINT episodes_patient_id_fkey;

-- +goose StatementEnd
