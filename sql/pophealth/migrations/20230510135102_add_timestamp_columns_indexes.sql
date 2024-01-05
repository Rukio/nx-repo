-- +goose Up
-- +goose StatementBegin
CREATE INDEX bucket_folder_email_notifications_updated_at_idx ON bucket_folder_email_notifications(updated_at);

CREATE INDEX bucket_folders_updated_at_idx ON bucket_folders(updated_at);

CREATE INDEX files_updated_at_idx ON files(updated_at);

CREATE INDEX files_result_codes_updated_at_idx ON files_result_codes(updated_at);

CREATE INDEX templates_updated_at_idx ON templates(updated_at);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS bucket_folder_email_notifications_updated_at_idx;

DROP INDEX IF EXISTS bucket_folders_updated_at_idx;

DROP INDEX IF EXISTS files_updated_at_idx;

DROP INDEX IF EXISTS files_result_codes_updated_at_idx;

DROP INDEX IF EXISTS templates_updated_at_idx;

-- +goose StatementEnd
