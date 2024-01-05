-- +goose Up
-- +goose StatementBegin
CREATE TABLE task_types (id BIGSERIAL PRIMARY KEY, slug TEXT NOT NULL);

COMMENT ON TABLE task_types IS 'Catalog of the types that can be assigned to tasks';

COMMENT ON COLUMN task_types.slug IS 'Name of the task type';

INSERT INTO
    task_types (id, slug)
VALUES
    (4, 'nurse_navigator'),
    (5, 'onboarding'),
    (6, 'daily_and_onboarding'),
    (7, 't1'),
    (8, 't2');

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    episode_id BIGINT NOT NULL,
    task_type_id BIGINT NOT NULL,
    completed_by_user_id BIGINT,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("episode_id") REFERENCES episodes("id"),
    FOREIGN KEY ("task_type_id") REFERENCES task_types("id")
);

COMMENT ON TABLE tasks IS 'Task entity than can be marked as completed or incompleted';

COMMENT ON COLUMN tasks.description IS 'Description of the task itself';

COMMENT ON COLUMN tasks.is_completed IS 'Whether the task has been completed or not';

COMMENT ON COLUMN tasks.episode_id IS 'Episode ID that owns this task';

COMMENT ON COLUMN tasks.task_type_id IS 'TaskType ID assigned to this task';

COMMENT ON COLUMN tasks.completed_by_user_id IS 'The ID of the user that marked this task as completed';

COMMENT ON COLUMN tasks.deleted_at IS 'Date of deletion of the task, it is also used to know if the task is deleted or not';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE tasks;

DROP TABLE task_types;

-- +goose StatementEnd
