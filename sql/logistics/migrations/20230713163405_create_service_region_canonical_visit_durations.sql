-- +goose Up
-- +goose StatementBegin
CREATE TABLE service_region_canonical_visit_durations(
    id bigserial PRIMARY KEY,
    service_region_id BIGINT NOT NULL,
    service_duration_min_sec BIGINT NOT NULL,
    service_duration_max_sec BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_region_canonical_visit_durations IS 'The visit durations for service regions, for checking feasibility';

COMMENT ON COLUMN service_region_canonical_visit_durations.service_region_id IS 'Service region';

COMMENT ON COLUMN service_region_canonical_visit_durations.service_duration_min_sec IS 'Minimal visit duration';

COMMENT ON COLUMN service_region_canonical_visit_durations.service_duration_max_sec IS 'Maximum visit duration';

CREATE INDEX service_region_canonical_visit_durations_idx ON service_region_canonical_visit_durations(service_region_id, created_at DESC);

COMMENT ON INDEX service_region_canonical_visit_durations_idx IS 'Lookup index on visit durations';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE service_region_canonical_visit_durations;

-- +goose StatementEnd
