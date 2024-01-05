-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    care_request_symptoms
ADD
    CONSTRAINT care_request_id_unique UNIQUE (care_request_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    care_request_symptoms DROP CONSTRAINT care_request_id_unique;

-- +goose StatementEnd
