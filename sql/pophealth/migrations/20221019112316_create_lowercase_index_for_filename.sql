-- +goose Up
-- +goose StatementBegin
CREATE INDEX lower_filename_idx ON files ((lower(filename)));

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX lower_filename_idx;

-- +goose StatementEnd
