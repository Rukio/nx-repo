-- +goose Up
-- +goose StatementBegin
CREATE INDEX task_template_tasks_template_id_idx ON task_template_tasks(template_id int8_ops);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX task_template_tasks_template_id_idx;

-- +goose StatementEnd
