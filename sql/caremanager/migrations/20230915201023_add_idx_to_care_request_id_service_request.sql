-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
CREATE INDEX CONCURRENTLY idx_care_request_id ON service_requests USING btree (care_request_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX idx_care_request_id;

-- +goose StatementEnd
