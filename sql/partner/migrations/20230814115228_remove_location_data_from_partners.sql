-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    partners DROP COLUMN address_line_one,
    DROP COLUMN address_line_two,
    DROP COLUMN city,
    DROP COLUMN state_code,
    DROP COLUMN zipcode,
    DROP COLUMN latitude_e6,
    DROP COLUMN longitude_e6;

CREATE INDEX locations_geo_location_idx ON locations(latitude_e6, longitude_e6);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX locations_geo_location_idx;

ALTER TABLE
    partners
ADD
    COLUMN address_line_one TEXT,
ADD
    COLUMN address_line_two TEXT,
ADD
    COLUMN city TEXT,
ADD
    COLUMN state_code TEXT,
ADD
    COLUMN zipcode TEXT,
ADD
    COLUMN latitude_e6 INT,
ADD
    COLUMN longitude_e6 INT;

CREATE INDEX partners_location_idx ON partners(latitude_e6, longitude_e6);

-- +goose StatementEnd
