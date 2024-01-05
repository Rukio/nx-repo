-- +goose Up
-- +goose StatementBegin
CREATE TABLE service_region_availability_query_attributes (
    id BIGSERIAL PRIMARY KEY,
    service_region_availability_query_id BIGINT NOT NULL,
    attribute_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX service_region_availability_query_attributes_idx ON service_region_availability_query_attributes (
    service_region_availability_query_id,
    attribute_id
);

COMMENT ON TABLE service_region_availability_query_attributes IS 'Join table between service_region_availability_queries and attributes';

COMMENT ON COLUMN service_region_availability_query_attributes.service_region_availability_query_id IS 'The associated availability query';

COMMENT ON COLUMN service_region_availability_query_attributes.attribute_id IS 'The associated attribute';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE service_region_availability_query_attributes;

-- +goose StatementEnd
