-- +goose Up
-- +goose StatementBegin
CREATE UNIQUE INDEX prefect_flow_run_id_idx ON files(prefect_flow_run_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS prefect_flow_run_id_idx;

-- +goose StatementEnd
