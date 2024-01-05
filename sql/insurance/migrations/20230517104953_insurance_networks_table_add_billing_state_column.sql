-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_networks
ADD
    COLUMN billing_state TEXT;

COMMENT ON COLUMN insurance_networks.billing_state IS 'The state to which the insurance claim for the patient is sent';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_networks DROP COLUMN billing_state;

-- +goose StatementEnd
