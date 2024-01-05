-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurances
ADD
    COLUMN priority INT DEFAULT 1 NOT NULL;

COMMENT ON COLUMN insurances.priority IS 'Priority of the patients insurance.';

ALTER TABLE
    insurances
ALTER COLUMN
    member_id TYPE TEXT USING member_id :: TEXT;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurances DROP COLUMN priority;

-- +goose StatementEnd
