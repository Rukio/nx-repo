-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    medical_decision_makers
ALTER COLUMN
    relationship DROP NOT NULL,
ALTER COLUMN
    phone_number DROP NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
UPDATE
    medical_decision_makers
SET
    relationship = ''
WHERE
    relationship IS NULL;

UPDATE
    medical_decision_makers
SET
    phone_number = ''
WHERE
    phone_number IS NULL;

ALTER TABLE
    medical_decision_makers
ALTER COLUMN
    relationship
SET
    NOT NULL,
ALTER COLUMN
    phone_number
SET
    NOT NULL;

-- +goose StatementEnd
