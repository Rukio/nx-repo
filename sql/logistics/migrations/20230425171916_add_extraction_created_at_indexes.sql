-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY distances_created_at_idx ON distances(created_at DESC);

CREATE INDEX CONCURRENTLY locations_created_at_idx ON locations(created_at DESC);

CREATE INDEX CONCURRENTLY schedule_visits_created_at_idx ON schedule_visits(created_at DESC);

CREATE INDEX CONCURRENTLY shift_team_attributes_created_at_idx ON shift_team_attributes(created_at DESC);

CREATE INDEX CONCURRENTLY shift_team_locations_created_at_idx ON shift_team_locations(created_at DESC);

CREATE INDEX CONCURRENTLY visit_attributes_created_at_idx ON visit_attributes(created_at DESC);

-- +goose Down
DROP INDEX CONCURRENTLY distances_created_at_idx;

DROP INDEX CONCURRENTLY locations_created_at_idx;

DROP INDEX CONCURRENTLY schedule_visits_created_at_idx;

DROP INDEX CONCURRENTLY shift_team_attributes_created_at_idx;

DROP INDEX CONCURRENTLY shift_team_locations_created_at_idx;

DROP INDEX CONCURRENTLY visit_attributes_created_at_idx;
