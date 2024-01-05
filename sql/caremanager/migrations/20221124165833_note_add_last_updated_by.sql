-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    notes
ADD
    COLUMN last_updated_by_user_id BIGINT;

COMMENT ON COLUMN notes.last_updated_by_user_id IS 'Reference to the user who last updated the note';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    notes DROP COLUMN last_updated_by_user_id;

-- +goose StatementEnd
