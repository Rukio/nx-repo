-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    check_feasibility_queries
ADD
    COLUMN response_status TEXT;

COMMENT ON COLUMN check_feasibility_queries.response_status IS 'the status response for the check feasibility query, in string form';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    check_feasibility_queries DROP COLUMN response_status;

-- +goose StatementEnd
