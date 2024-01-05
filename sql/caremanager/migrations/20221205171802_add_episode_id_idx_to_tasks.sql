-- +goose Up
-- +goose StatementBegin
CREATE INDEX tasks_episode_id ON tasks (episode_id);

CREATE INDEX episode_market_id ON episodes (market_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX episode_market_id;

DROP INDEX tasks_episode_id;

-- +goose StatementEnd
