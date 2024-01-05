-- +goose Up
-- +goose StatementBegin
CREATE INDEX network_modality_configurations_service_line_id_idx ON network_modality_configurations(service_line_id);

COMMENT ON INDEX network_modality_configurations_service_line_id_idx IS 'Lookup index for network_modality_configurations by service_line_id';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX network_modality_configurations_service_line_id_idx;

-- +goose StatementEnd
