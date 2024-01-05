-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    service_requests
ADD
    COLUMN rejected_at TIMESTAMP WITHOUT TIME ZONE;

COMMENT ON COLUMN service_requests.rejected_at IS 'The date when the Service Request was rejected';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    service_requests DROP COLUMN rejected_at;

-- +goose StatementEnd
