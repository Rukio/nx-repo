-- +goose Up
-- +goose StatementBegin
CREATE TABLE check_feasibility_queries (
    id BIGSERIAL PRIMARY KEY,
    care_request_id BIGINT,
    service_region_id BIGINT,
    location_id BIGINT,
    service_date date,
    arrival_time_window_start_timestamp_sec BIGINT,
    arrival_time_window_end_timestamp_sec BIGINT,
    service_duration_sec BIGINT,
    optimizer_run_id BIGINT,
    best_schedule_id BIGINT,
    best_schedule_is_feasible BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE check_feasibility_queries IS 'Check feasibility diagnostic information';

COMMENT ON COLUMN check_feasibility_queries.care_request_id IS 'Care request to check feasibility';

COMMENT ON COLUMN check_feasibility_queries.service_region_id IS 'The service region to check feasibility';

COMMENT ON COLUMN check_feasibility_queries.optimizer_run_id IS 'The optimizer run against which feasibility was checked';

COMMENT ON COLUMN check_feasibility_queries.best_schedule_id IS 'The last schedule returned by the optimizer for this check feasibility query';

COMMENT ON COLUMN check_feasibility_queries.best_schedule_is_feasible IS 'Is the best schedule feasible';

COMMENT ON COLUMN check_feasibility_queries.location_id IS 'The location to check for feasibility';

COMMENT ON COLUMN check_feasibility_queries.service_date IS 'The service date to check for feasibility';

COMMENT ON COLUMN check_feasibility_queries.arrival_time_window_start_timestamp_sec IS 'The requested arrival time window start, in seconds';

COMMENT ON COLUMN check_feasibility_queries.arrival_time_window_end_timestamp_sec IS 'The requested arrival time window end, in seconds';

COMMENT ON COLUMN check_feasibility_queries.service_duration_sec IS 'The estimated service duration in seconds';

CREATE INDEX check_feasibility_queries_care_request_idx ON check_feasibility_queries(care_request_id, created_at DESC);

CREATE TABLE check_feasibility_query_attributes (
    id BIGSERIAL PRIMARY KEY,
    check_feasibility_query_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    is_forbidden BOOLEAN DEFAULT FALSE,
    is_preferred BOOLEAN DEFAULT FALSE,
    is_unwanted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE check_feasibility_query_attributes IS 'Check feasibility query attributes';

COMMENT ON COLUMN check_feasibility_query_attributes.check_feasibility_query_id IS 'Check feasibility query';

COMMENT ON COLUMN check_feasibility_query_attributes.attribute_id IS 'Attribute';

COMMENT ON COLUMN check_feasibility_query_attributes.is_required IS 'Is required attribute';

COMMENT ON COLUMN check_feasibility_query_attributes.is_forbidden IS 'Is forbidden attribute';

COMMENT ON COLUMN check_feasibility_query_attributes.is_preferred IS 'Is preferred attribute';

COMMENT ON COLUMN check_feasibility_query_attributes.is_unwanted IS 'Is unwanted attribute';

CREATE UNIQUE INDEX check_feasibility_query_attributes_idx ON check_feasibility_query_attributes(check_feasibility_query_id, attribute_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE check_feasibility_queries;

DROP TABLE check_feasibility_query_attributes;

-- +goose StatementEnd
