-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    partners DROP COLUMN insurance_package_id;

ALTER TABLE
    partners
ADD
    COLUMN insurance_package_id BIGINT;

COMMENT ON COLUMN partners.insurance_package_id IS 'Corporate insurance package id configured for the partner';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    partners DROP COLUMN insurance_package_id;

ALTER TABLE
    partners
ADD
    COLUMN insurance_package_id TEXT;

COMMENT ON COLUMN partners.insurance_package_id IS 'Corporate insurance package id configured for the partner';

-- +goose StatementEnd
