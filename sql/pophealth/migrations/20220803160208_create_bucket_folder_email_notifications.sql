-- +goose Up
-- +goose StatementBegin
CREATE TABLE bucket_folder_email_notifications (
    id bigserial PRIMARY KEY,
    email TEXT NOT NULL,
    bucket_folder_id BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX bucket_folder_email_notifications_unique_idx ON bucket_folder_email_notifications(bucket_folder_id, email);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE bucket_folder_email_notifications;

-- +goose StatementEnd
