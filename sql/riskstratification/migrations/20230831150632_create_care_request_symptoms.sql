-- +goose Up
-- +goose StatementBegin
CREATE TABLE care_request_symptoms (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    care_request_id uuid NOT NULL,
    symptom_data jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE care_request_symptoms;

-- +goose StatementEnd
