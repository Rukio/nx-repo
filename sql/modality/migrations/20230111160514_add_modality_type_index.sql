-- +goose Up
-- +goose StatementBegin
CREATE INDEX modality_type_idx ON modalities(modality_type);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX modality_type_idx;

-- +goose StatementEnd
