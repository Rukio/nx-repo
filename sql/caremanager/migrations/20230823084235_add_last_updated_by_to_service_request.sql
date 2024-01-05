-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    service_requests
ADD
    COLUMN last_updated_by_user_id BIGINT;

COMMENT ON COLUMN service_requests.last_updated_by_user_id IS 'Reference to the user who last updated the service request';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    service_requests DROP COLUMN last_updated_by_user_id;

-- +goose StatementEnd
