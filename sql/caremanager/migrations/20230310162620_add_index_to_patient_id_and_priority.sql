-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
CREATE INDEX CONCURRENTLY insurances_patient_id_priority_idx ON insurances(patient_id, priority ASC);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX CONCURRENTLY insurances_patient_id_priority_idx;

-- +goose StatementEnd
