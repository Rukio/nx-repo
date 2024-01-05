-- +goose Up
-- +goose StatementBegin
CREATE TABLE locations (
    id bigserial PRIMARY KEY,
    latitude_e6 INTEGER NOT NULL,
    longitude_e6 INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE locations IS 'Locations (latitude, longitude)';

COMMENT ON COLUMN locations.latitude_e6 IS 'Latitude, multiplied by 1e6';

COMMENT ON COLUMN locations.longitude_e6 IS 'Longitude, multiplied by 1e6';

CREATE UNIQUE INDEX location_lat_lng_idx ON locations(latitude_e6, longitude_e6);

COMMENT ON INDEX location_lat_lng_idx IS 'Unique index of locations';

ALTER TABLE
    locations
ADD
    CONSTRAINT location_unique_lat_lng UNIQUE USING INDEX location_lat_lng_idx;

COMMENT ON CONSTRAINT location_unique_lat_lng ON locations IS 'Unique index of locations';

CREATE TABLE distance_sources (
    id bigserial PRIMARY KEY,
    short_name TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE distance_sources IS 'Sources of Distance information';

COMMENT ON COLUMN distance_sources.short_name IS 'Short name of source';

COMMENT ON COLUMN distance_sources.description IS 'Description of source';

CREATE INDEX distance_source_short_name_idx ON distance_sources(short_name);

COMMENT ON INDEX distance_source_short_name_idx IS 'Index of distance source short names';

CREATE TABLE distances (
    id bigserial PRIMARY KEY,
    source_id BIGINT NOT NULL,
    from_location_id BIGINT NOT NULL,
    to_location_id BIGINT NOT NULL,
    distance_meters INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE distances IS 'Distances between locations';

COMMENT ON COLUMN distances.source_id IS 'Distance source used to get distance';

COMMENT ON COLUMN distances.from_location_id IS 'From location';

COMMENT ON COLUMN distances.to_location_id IS 'To location';

COMMENT ON COLUMN distances.distance_meters IS 'Meters between from_location_id and to_location_id';

COMMENT ON COLUMN distances.duration_seconds IS 'Seconds between from_location_id and to_location_id';

CREATE INDEX distance_idx ON distances(
    from_location_id,
    to_location_id,
    source_id,
    created_at DESC
);

COMMENT ON INDEX distance_idx IS 'Index of distances';

INSERT INTO
    distance_sources (id, short_name, description)
VALUES
    (
        1,
        'osrm',
        'Open Source Routing Machine (Open Street Maps)'
    ),
    (2, 'google_maps', 'Google Maps');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE distance_sources;

DROP TABLE distances;

DROP TABLE locations;

-- +goose StatementEnd
