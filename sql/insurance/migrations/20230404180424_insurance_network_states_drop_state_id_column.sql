-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_network_states DROP COLUMN state_id;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_network_states
ADD
    COLUMN state_id BIGINT;

COMMENT ON COLUMN insurance_network_states.state_id IS 'Reference to the State ID in station to which the Insurance Network belongs to';

-- +goose StatementEnd
