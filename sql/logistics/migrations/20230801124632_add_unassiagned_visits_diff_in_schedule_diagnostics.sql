-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    schedule_diagnostics
ADD
    COLUMN unassigned_visits_diff BIGINT;

COMMENT ON COLUMN schedule_diagnostics.unassigned_visits_diff IS 'the number of unassigned visits between the base schedule and the result schedule';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    schedule_diagnostics DROP COLUMN unassigned_visits_diff;

-- +goose StatementEnd
