-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    service_region_availability_visits
ADD
    COLUMN service_duration_sec BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN service_region_availability_visits.service_duration_sec IS 'service duration for availability visits, in seconds';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    service_region_availability_visits DROP COLUMN service_duration_sec;

-- +goose StatementEnd
