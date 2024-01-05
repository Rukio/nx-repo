-- +goose Up
-- +goose StatementBegin
-- add_address_latitude_and_longitude.sql
-- Add latitude and longitude columns to addresses table
ALTER TABLE
    addresses
ADD
    COLUMN latitude_e6 INTEGER,
ADD
    COLUMN longitude_e6 INTEGER;

COMMENT ON COLUMN addresses.latitude_e6 IS 'Latitude of the address multiplied by 1e6';

COMMENT ON COLUMN addresses.longitude_e6 IS 'Longitude of the address multiplied by 1e6';

-- +goose StatementEnd
