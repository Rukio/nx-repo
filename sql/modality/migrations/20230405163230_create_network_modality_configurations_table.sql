-- +goose Up
-- +goose StatementBegin
CREATE TABLE network_modality_configurations(
    id bigserial PRIMARY KEY,
    network_id BIGINT NOT NULL,
    billing_city_id BIGINT NOT NULL,
    service_line_id BIGINT NOT NULL,
    modality_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modality_id) REFERENCES modalities(id)
);

CREATE INDEX network_modality_configurations_network_id_idx ON network_modality_configurations(network_id);

COMMENT ON TABLE network_modality_configurations IS 'Reference table for insurance network modality configurations';

COMMENT ON COLUMN network_modality_configurations.network_id IS 'ID of insurance network used in network modality configuration';

COMMENT ON COLUMN network_modality_configurations.billing_city_id IS 'ID of the station billing city used in network modality configuration';

COMMENT ON COLUMN network_modality_configurations.service_line_id IS 'ID of the station service-line used in network modality configuration';

COMMENT ON COLUMN network_modality_configurations.modality_id IS 'ID of modality used in network modality configuration, also used as foreign key';

COMMENT ON INDEX network_modality_configurations_network_id_idx IS 'Lookup index for network_modality_configurations by network_id';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE network_modality_configurations;

-- +goose StatementEnd
