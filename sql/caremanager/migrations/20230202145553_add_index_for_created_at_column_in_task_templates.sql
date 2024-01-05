-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
CREATE INDEX CONCURRENTLY task_templates_id_created_at_idx ON task_templates(id, created_at ASC);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX CONCURRENTLY task_templates_id_created_at_idx;

-- +goose StatementEnd
