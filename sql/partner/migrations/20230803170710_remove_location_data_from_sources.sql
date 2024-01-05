-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    partner_configuration_sources DROP COLUMN address_line_one,
    DROP COLUMN address_line_two,
    DROP COLUMN city,
    DROP COLUMN state,
    DROP COLUMN zip_code;

ALTER TABLE
    partner_configuration_sources
ADD
    COLUMN location_id BIGINT;

COMMENT ON COLUMN partner_configuration_sources.location_id IS 'refers to locations table identifier';

CREATE INDEX partner_configuration_sources_location_id_idx ON partner_configuration_sources (location_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    partner_configuration_sources DROP COLUMN location_id;

ALTER TABLE
    partner_configuration_sources
ADD
    COLUMN address_line_one TEXT,
ADD
    COLUMN address_line_two TEXT,
ADD
    COLUMN city TEXT,
ADD
    COLUMN state TEXT,
ADD
    COLUMN zip_code TEXT;

-- +goose StatementEnd
