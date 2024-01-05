-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_networks
ADD
    COLUMN package_id BIGINT NOT NULL;

COMMENT ON COLUMN insurance_networks.package_id IS 'The ID of the Insurance Package in Athena that this Insurance Network belongs to';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_networks DROP COLUMN package_id;

-- +goose StatementEnd
