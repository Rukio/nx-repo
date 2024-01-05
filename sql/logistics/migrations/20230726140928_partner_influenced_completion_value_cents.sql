-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    visit_value_snapshots
ADD
    COLUMN partner_influenced_completion_value_cents BIGINT;

COMMENT ON COLUMN visit_value_snapshots.partner_influenced_completion_value_cents IS 'The calculated number of 1/100 points for completing a care request using partner priority score';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    visit_value_snapshots DROP COLUMN partner_influenced_completion_value_cents;

-- +goose StatementEnd
