-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    visit_acuity_snapshots
ALTER COLUMN
    clinical_urgency_level_id DROP NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
SELECT
    'irreversible';

-- +goose StatementEnd
