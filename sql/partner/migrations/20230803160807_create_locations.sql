-- +goose Up
-- +goose StatementBegin
CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    address_line_one TEXT,
    address_line_two TEXT,
    city TEXT,
    state_code TEXT,
    zip_code TEXT,
    latitude_e6 INT,
    longitude_e6 INT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE locations IS 'address and geo location for entities that require a location';

COMMENT ON COLUMN locations.address_line_one IS 'address line one for this location';

COMMENT ON COLUMN locations.address_line_two IS 'address line two for this location';

COMMENT ON COLUMN locations.city IS 'city for this location';

COMMENT ON COLUMN locations.state_code IS 'state code for this location';

COMMENT ON COLUMN locations.zip_code IS 'ZIP code for this location';

COMMENT ON COLUMN locations.latitude_e6 IS 'latitude for this location multiplied by 1e6';

COMMENT ON COLUMN locations.longitude_e6 IS 'longitude for this location multiplied by 1e6';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS locations;

-- +goose StatementEnd
