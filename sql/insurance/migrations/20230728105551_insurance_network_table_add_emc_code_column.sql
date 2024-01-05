-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_networks
ADD
    COLUMN emc_code TEXT;

COMMENT ON COLUMN insurance_networks.emc_code IS 'The EMC code of this Insurance Network';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_networks DROP COLUMN emc_code;

-- +goose StatementEnd
