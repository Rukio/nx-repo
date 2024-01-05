-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS facility_type(
    id bigserial PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE facility_type IS 'Types of facilities where care is given';

COMMENT ON COLUMN facility_type.name IS 'Name of the facility type, i.e. home, virtual_visit, long_term_care_facility';

INSERT INTO
    facility_type(id, name)
VALUES
    (1, 'home'),
    (2, 'work'),
    (3, 'independent_living_facility'),
    (4, 'assisted_living_facility'),
    (5, 'skilled_nursing_facility'),
    (6, 'clinic'),
    (7, 'long_term_care_facility'),
    (8, 'rehabilitation_facility'),
    (9, 'virtual_visit'),
    (10, 'senior_living_testing'),
    (11, 'school'),
    (12, 'hotel') ON CONFLICT DO NOTHING;

-- Default to HOME if addresses already exist at time of migration
ALTER TABLE
    addresses
ADD
    COLUMN facility_type_id BIGINT NOT NULL DEFAULT 1,
ADD
    CONSTRAINT fk_addresses_facility_type FOREIGN KEY (facility_type_id) REFERENCES facility_type (id);

COMMENT ON COLUMN addresses.facility_type_id IS 'ID of the facility type where care is given, i.e. Home, Virtual Visit, Long-term Care Facility';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    addresses DROP COLUMN facility_type_id;

DROP TABLE IF EXISTS facility_type;

-- +goose StatementEnd
