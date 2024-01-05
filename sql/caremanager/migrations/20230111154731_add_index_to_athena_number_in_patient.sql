-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
CREATE INDEX CONCURRENTLY idx_athena_medical_record_number ON patients USING btree (athena_medical_record_number);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX idx_athena_medical_record_number;

-- +goose StatementEnd
