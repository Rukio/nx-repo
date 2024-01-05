-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    care_request_symptoms DROP COLUMN care_request_id;

ALTER TABLE
    care_request_symptoms
ADD
    COLUMN care_request_id BIGINT;

UPDATE
    care_request_symptoms
SET
    care_request_id = 0;

ALTER TABLE
    care_request_symptoms
ALTER COLUMN
    care_request_id
SET
    NOT NULL;

ALTER TABLE
    care_request_symptoms
ADD
    CONSTRAINT care_request_id_unique UNIQUE (care_request_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    care_request_symptoms DROP COLUMN care_request_id;

ALTER TABLE
    care_request_symptoms
ADD
    COLUMN care_request_id uuid;

UPDATE
    care_request_symptoms
SET
    care_request_id = uuid_generate_v4();

ALTER TABLE
    care_request_symptoms
ALTER COLUMN
    care_request_id
SET
    NOT NULL;

ALTER TABLE
    care_request_symptoms
ADD
    CONSTRAINT care_request_id_unique UNIQUE (care_request_id);

-- +goose StatementEnd
