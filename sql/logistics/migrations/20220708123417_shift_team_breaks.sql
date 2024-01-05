-- +goose Up
-- +goose StatementBegin
CREATE TABLE schedule_stops(
    id bigserial PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    schedule_route_id BIGINT NOT NULL,
    route_index INTEGER NOT NULL,
    schedule_visit_id BIGINT,
    schedule_rest_break_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE schedule_stops IS 'Route stops within a schedule';

COMMENT ON COLUMN schedule_stops.schedule_id IS 'Schedule to which the route and stops belong';

COMMENT ON COLUMN schedule_stops.schedule_route_id IS 'Route within the schedule to which the stops belong ';

COMMENT ON COLUMN schedule_stops.route_index IS 'Index of the stop within the schedule route';

COMMENT ON COLUMN schedule_stops.schedule_visit_id IS 'Schedule visit at this stop, if not null';

COMMENT ON COLUMN schedule_stops.schedule_rest_break_id IS 'Rest break at this stop, if not null';

-- enforce that exactly one of of the stop types is set on the row.
ALTER TABLE
    schedule_stops
ADD
    CONSTRAINT unique_stop_type_check CHECK (
        (
            (schedule_visit_id IS NOT NULL) :: INTEGER + (schedule_rest_break_id IS NOT NULL) :: INTEGER
        ) = 1
    );

CREATE UNIQUE INDEX schedule_stop_route_unique_idx ON schedule_stops(schedule_route_id, route_index);

CREATE INDEX schedule_stop_schedule_idx ON schedule_stops(schedule_id);

CREATE TABLE shift_team_rest_break_requests (
    id bigserial PRIMARY KEY,
    shift_team_id BIGINT NOT NULL,
    start_timestamp_sec BIGINT NOT NULL,
    duration_sec BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shift_team_rest_break_requests IS 'Shift team break requests received via API';

COMMENT ON COLUMN shift_team_rest_break_requests.shift_team_id IS 'Shift team that requested the break';

COMMENT ON COLUMN shift_team_rest_break_requests.start_timestamp_sec IS 'Start timestamp of the requested break';

COMMENT ON COLUMN shift_team_rest_break_requests.duration_sec IS 'Length of the requested break, in seconds';

COMMENT ON COLUMN shift_team_rest_break_requests.location_id IS 'Location associated with the break request';

-- not a unique index because we may later want to allow multiple breaks for a shift team.
CREATE INDEX shift_team_rest_breaks_requests_shift_team_id_idx ON shift_team_rest_break_requests(shift_team_id, created_at DESC);

CREATE TABLE schedule_rest_breaks(
    id bigserial PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    schedule_route_id BIGINT NOT NULL,
    shift_team_break_request_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE schedule_rest_breaks IS 'Rest break information associated with a schedule route stop';

COMMENT ON COLUMN schedule_rest_breaks.schedule_id IS 'Schedule to which this rest break stop belongs';

COMMENT ON COLUMN schedule_rest_breaks.schedule_route_id IS 'Schedule route to which this rest break stop belongs';

COMMENT ON COLUMN schedule_rest_breaks.shift_team_break_request_id IS 'Break request associated with the rest break stop';

CREATE INDEX schedule_rest_break_idx ON schedule_rest_breaks(shift_team_break_request_id);

CREATE INDEX schedule_rest_break_schedule_idx ON schedule_rest_breaks(schedule_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE schedule_rest_breaks;

DROP TABLE shift_team_rest_break_requests;

DROP TABLE schedule_stops;

-- +goose StatementEnd
