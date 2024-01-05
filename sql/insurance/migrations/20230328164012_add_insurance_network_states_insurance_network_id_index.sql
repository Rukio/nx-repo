-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
CREATE INDEX CONCURRENTLY insurance_network_states_insurance_network_idx ON insurance_network_states(insurance_network_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX insurance_network_states_insurance_network_idx;

-- +goose StatementEnd
