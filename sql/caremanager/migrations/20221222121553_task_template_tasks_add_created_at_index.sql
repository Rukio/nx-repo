-- +goose Up
-- +goose StatementBegin
DROP INDEX tasks_episode_id_created_at_idx;

DROP INDEX tasks_episode_id;

CREATE INDEX tasks_episode_id_created_at_idx ON tasks(episode_id, created_at ASC);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX tasks_episode_id_created_at_idx;

CREATE INDEX tasks_episode_id ON tasks (episode_id);

CREATE INDEX tasks_episode_id_created_at_idx ON tasks(episode_id, created_at DESC);

-- +goose StatementEnd
