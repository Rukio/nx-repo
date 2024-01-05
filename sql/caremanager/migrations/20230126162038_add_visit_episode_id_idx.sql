-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
CREATE INDEX CONCURRENTLY visits_episode_id_idx ON visits(episode_id, created_at DESC);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX visits_episode_id_idx;

-- +goose StatementEnd
