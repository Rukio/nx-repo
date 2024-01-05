-- +goose Up
-- +goose StatementBegin
DROP INDEX IF EXISTS channel_item_id_unique_idx;

CREATE INDEX templates_channel_item_id_idx ON templates(channel_item_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS templates_channel_item_id_idx;

CREATE UNIQUE INDEX channel_item_id_unique_idx ON templates(channel_item_id);

-- +goose StatementEnd
