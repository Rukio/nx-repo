-- +goose Up
-- +goose StatementBegin
CREATE TABLE episodes_task_templates (
    episode_id BIGSERIAL NOT NULL,
    task_template_id BIGSERIAL NOT NULL,
    FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id"),
    FOREIGN KEY ("task_template_id") REFERENCES "public"."task_templates"("id")
);

COMMENT ON TABLE episodes_task_templates IS 'Keeps track of which task templates have been assigned to an episode';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE episodes_task_templates;

-- +goose StatementEnd
