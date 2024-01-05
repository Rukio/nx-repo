-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_network_states
ADD
    COLUMN state_abbr VARCHAR(2) NOT NULL;

COMMENT ON COLUMN insurance_network_states.state_abbr IS 'Reference to the State abbreviation (2 character state code) in station to which the Insurance Network belongs to';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_network_states DROP COLUMN state_abbr;

-- +goose StatementEnd
