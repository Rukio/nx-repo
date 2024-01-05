-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_networks DROP COLUMN state;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_networks
ADD
    COLUMN state TEXT;

COMMENT ON COLUMN insurance_networks.state IS 'The state at which the Insurance claim for the patient is sent';

-- +goose StatementEnd
