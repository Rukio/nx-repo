-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    result_codes
ADD
    COLUMN code_level TEXT NOT NULL;

ALTER TABLE
    files_result_codes
ADD
    COLUMN number_of_occurrences INT NOT NULL DEFAULT 1,
ADD
    COLUMN first_occurrence INT,
ADD
    COLUMN field TEXT;

ALTER TABLE
    files DROP COLUMN reason_for_failure,
    DROP COLUMN error_count;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    result_codes DROP COLUMN code_level;

ALTER TABLE
    files_result_codes DROP COLUMN number_of_occurrences,
    DROP COLUMN first_occurrence,
    DROP COLUMN field;

ALTER TABLE
    files
ADD
    COLUMN reason_for_failure TEXT,
ADD
    COLUMN error_count BIGINT;

-- +goose StatementEnd
