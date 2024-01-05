-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_networks
ADD
    COLUMN insurance_classification_id BIGINT NOT NULL;

COMMENT ON COLUMN insurance_networks.insurance_classification_id IS 'The ID of the Insurance Classification that this Insurance Network belongs to';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_networks DROP COLUMN insurance_classification_id;

-- +goose StatementEnd
