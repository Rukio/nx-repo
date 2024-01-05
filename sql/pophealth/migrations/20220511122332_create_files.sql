-- +goose Up
-- +goose StatementBegin
CREATE TABLE files (
    id bigserial PRIMARY KEY,
    filename TEXT NOT NULL,
    aws_object_key TEXT NOT NULL,
    number_of_patients_loaded INT NOT NULL DEFAULT 0,
    status INT NOT NULL,
    reason_for_failure TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    bucket_folder_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX files_sort_idx ON files(bucket_folder_id, created_at);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS files;

-- +goose StatementEnd
