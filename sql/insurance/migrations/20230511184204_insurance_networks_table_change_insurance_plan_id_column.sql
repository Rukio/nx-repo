-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_networks
ALTER COLUMN
    insurance_plan_id
SET
    NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_networks
ALTER COLUMN
    insurance_plan_id DROP NOT NULL;

-- +goose StatementEnd
