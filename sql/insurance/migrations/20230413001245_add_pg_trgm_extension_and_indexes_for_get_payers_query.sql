-- +goose NO TRANSACTION
-- +goose Up
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY insurance_payers_name_trgm_idx ON insurance_payers USING gin (LOWER(name) gin_trgm_ops);

CREATE INDEX CONCURRENTLY insurance_network_states_state_abbr_idx ON insurance_network_states(state_abbr);

-- +goose Down
DROP INDEX CONCURRENTLY insurance_network_states_state_abbr_idx;

DROP INDEX CONCURRENTLY insurance_payers_name_trgm_idx;

DROP EXTENSION pg_trgm;
