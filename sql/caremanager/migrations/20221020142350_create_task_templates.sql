-- +goose Up
-- +goose StatementBegin
CREATE TABLE task_templates (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    summary TEXT,
    service_line_id BIGINT NOT NULL,
    care_phase_id BIGINT,
    created_by_user_id BIGINT NOT NULL,
    last_updated_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    FOREIGN KEY ("service_line_id") REFERENCES service_lines("id"),
    FOREIGN KEY ("care_phase_id") REFERENCES care_phases("id")
);

COMMENT ON TABLE task_templates IS 'CareManager Task Templates table';

COMMENT ON COLUMN task_templates.name IS 'Name of the task template';

COMMENT ON COLUMN task_templates.summary IS 'Summary of the task template';

COMMENT ON COLUMN task_templates.service_line_id IS 'Service line ID of the task template';

COMMENT ON COLUMN task_templates.care_phase_id IS 'Care phase of the task template';

COMMENT ON COLUMN task_templates.created_by_user_id IS 'ID of the user who created the task template';

COMMENT ON COLUMN task_templates.last_updated_by_user_id IS 'ID of the last user who updated the task template';

CREATE TABLE task_template_tasks (
    id BIGSERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    type_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    FOREIGN KEY ("type_id") REFERENCES task_types(id),
    FOREIGN KEY ("template_id") REFERENCES task_templates(id)
);

COMMENT ON TABLE task_template_tasks IS 'CareManager task template task table. Holds the tasks for each task template';

COMMENT ON COLUMN task_template_tasks.body IS 'Body of the task template task';

COMMENT ON COLUMN task_template_tasks.type_id IS 'Type ID of the task template task';

COMMENT ON COLUMN task_template_tasks.template_id IS 'ID of the task template this task belongs to';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE task_template_tasks;

DROP TABLE task_templates;

-- +goose StatementEnd
