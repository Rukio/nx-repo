-- +goose Up
-- +goose StatementBegin
CREATE TABLE market_modality_configurations(
    id bigserial PRIMARY KEY,
    market_id BIGINT NOT NULL,
    service_line_id BIGINT NOT NULL,
    modality_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modality_id) REFERENCES modalities(id)
);

CREATE INDEX market_modality_configurations_service_line_id_idx ON market_modality_configurations(service_line_id);

COMMENT ON TABLE market_modality_configurations IS 'Reference table for market modality configurations';

COMMENT ON COLUMN market_modality_configurations.market_id IS 'Id of market used in market modality configuration';

COMMENT ON COLUMN market_modality_configurations.service_line_id IS 'Id of service-line used in market modality configuration';

COMMENT ON COLUMN market_modality_configurations.modality_id IS 'Id of modality used in market modality configuration, also used as foreign key';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE market_modality_configurations;

-- +goose StatementEnd
