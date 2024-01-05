-- +goose Up
-- +goose StatementBegin
CREATE TABLE service_region_availability_queries (
    id BIGSERIAL PRIMARY KEY,
    service_region_id BIGINT NOT NULL,
    service_date DATE NOT NULL,
    reference_schedule_id BIGINT,
    feasibility_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_region_availability_queries IS 'Service region availability diagnostic information';

COMMENT ON COLUMN service_region_availability_queries.service_region_id IS 'The service region identifier';

COMMENT ON COLUMN service_region_availability_queries.service_date IS 'The service date for service region availability';

COMMENT ON COLUMN service_region_availability_queries.reference_schedule_id IS 'The reference schedule all availability VRP problems are built against';

COMMENT ON COLUMN service_region_availability_queries.feasibility_status IS 'One of the logistics.CheckFeasibilityResponse.Status enum values';

CREATE INDEX service_region_availability_queries_service_region_service_date_idx ON service_region_availability_queries(service_region_id, service_date, created_at DESC);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE service_region_availability_queries;

-- +goose StatementEnd
