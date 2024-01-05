-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    optimizer_runs
ADD
    COLUMN is_feasibility_check BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN optimizer_runs.is_feasibility_check IS 'Optimizer run was created for a feasibility check, and should not be used for production queries.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    optimizer_runs DROP COLUMN is_feasibility_check;

-- +goose StatementEnd
