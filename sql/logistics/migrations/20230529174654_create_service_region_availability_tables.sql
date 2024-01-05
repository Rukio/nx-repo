-- +goose Up
-- +goose StatementBegin
CREATE TABLE service_region_availability_visits (
    id BIGSERIAL PRIMARY KEY,
    arrival_start_time TIME WITHOUT TIME ZONE NOT NULL,
    arrival_end_time TIME WITHOUT TIME ZONE NOT NULL,
    service_region_availability_visit_set_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX service_region_availability_visit_created_at_idx ON service_region_availability_visits (created_at DESC);

CREATE INDEX service_region_availability_visit_set_idx ON service_region_availability_visits (service_region_availability_visit_set_id);

COMMENT ON TABLE service_region_availability_visits IS 'Availability visits for a service region';

COMMENT ON COLUMN service_region_availability_visits.arrival_start_time IS 'The visit arrival start time';

COMMENT ON COLUMN service_region_availability_visits.arrival_end_time IS 'The visit arrival end time';

COMMENT ON COLUMN service_region_availability_visits.service_region_availability_visit_set_id IS 'The associated set';

CREATE TABLE service_region_availability_visit_sets (
    id BIGSERIAL PRIMARY KEY,
    service_region_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_region_availability_visit_sets IS 'Set of the availability visits in a service region';

COMMENT ON COLUMN service_region_availability_visit_sets.service_region_id IS 'The associated service region';

CREATE INDEX service_region_availability_visit_sets_created_idx ON service_region_availability_visit_sets(created_at DESC);

CREATE INDEX service_region_availability_visit_sets_service_region_idx ON service_region_availability_visit_sets(service_region_id);

CREATE TABLE service_region_availability_visit_attributes (
    id BIGSERIAL PRIMARY KEY,
    service_region_availability_visit_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    is_required BOOLEAN NOT NULL,
    is_forbidden BOOLEAN NOT NULL,
    is_preferred BOOLEAN NOT NULL,
    is_unwanted BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX service_region_availability_visit_attributes_idx ON service_region_availability_visit_attributes (
    service_region_availability_visit_id,
    attribute_id
);

CREATE INDEX service_region_availability_visit_attributes_created_idx ON service_region_availability_visit_attributes(created_at DESC);

COMMENT ON TABLE service_region_availability_visit_attributes IS 'Join table between availability_visits and attributes';

COMMENT ON COLUMN service_region_availability_visit_attributes.service_region_availability_visit_id IS 'The associated availability visit';

COMMENT ON COLUMN service_region_availability_visit_attributes.attribute_id IS 'The associated attribute';

COMMENT ON COLUMN service_region_availability_visit_attributes.is_required IS 'Is required';

COMMENT ON COLUMN service_region_availability_visit_attributes.is_forbidden IS 'Is forbidden';

COMMENT ON COLUMN service_region_availability_visit_attributes.is_preferred IS 'Is preferred';

COMMENT ON COLUMN service_region_availability_visit_attributes.is_unwanted IS 'Is unwanted';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE service_region_availability_visit_attributes;

DROP TABLE service_region_availability_visit_sets;

DROP TABLE service_region_availability_visits;

-- +goose StatementEnd
