-- +goose Up
-- +goose StatementBegin
CREATE INDEX notes_episode_id_created_at_idx ON notes(episode_id, created_at DESC);

CREATE INDEX notes_episode_id_pinned_created_at_idx ON notes(episode_id, pinned DESC, created_at DESC);

CREATE INDEX tasks_episode_id_created_at_idx ON tasks(episode_id, created_at DESC);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX tasks_episode_id_created_at_idx;

DROP INDEX notes_episode_id_pinned_created_at_idx;

DROP INDEX notes_episode_id_created_at_idx;

-- +goose StatementEnd
