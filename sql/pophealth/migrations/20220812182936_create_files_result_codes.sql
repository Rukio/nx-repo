-- +goose Up
-- +goose StatementBegin
CREATE TABLE files_result_codes (
    id bigserial PRIMARY KEY,
    file_id BIGINT NOT NULL,
    result_code_id BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX files_result_codes_unique_idx ON files_result_codes(file_id, result_code_id);

ALTER TABLE
    files DROP COLUMN result_code_id;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE files_result_codes;

ALTER TABLE
    files
ADD
    COLUMN result_code_id BIGINT;

-- +goose StatementEnd
