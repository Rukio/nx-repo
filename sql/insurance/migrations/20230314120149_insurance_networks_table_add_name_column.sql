-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_networks
ADD
    COLUMN name TEXT NOT NULL;

COMMENT ON COLUMN insurance_networks.name IS 'The name of the Insurance Network';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_networks DROP COLUMN name;

-- +goose StatementEnd
