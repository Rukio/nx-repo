-- +goose Up
-- +goose StatementBegin
CREATE TABLE result_codes (
    id bigserial PRIMARY KEY,
    code TEXT NOT NULL,
    code_description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE UNIQUE INDEX code_unique_idx ON result_codes(code);

ALTER TABLE
    IF EXISTS files
ADD
    COLUMN result_code_id BIGINT;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS result_codes;

ALTER TABLE
    IF EXISTS files DROP COLUMN IF EXISTS result_code_id;

-- +goose StatementEnd
