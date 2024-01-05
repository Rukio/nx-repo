-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX task_templates_name_trgm_idx ON task_templates USING gin (name gin_trgm_ops);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX task_templates_name_trgm_idx;

DROP EXTENSION pg_trgm;

-- +goose StatementEnd
