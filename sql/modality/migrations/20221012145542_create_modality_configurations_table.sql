-- +goose Up
-- +goose StatementBegin
CREATE TABLE modality_configurations(
    id bigserial PRIMARY KEY,
    market_id BIGINT NOT NULL,
    insurance_plan_id BIGINT NOT NULL,
    service_line_id BIGINT NOT NULL,
    modality_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modality_id) REFERENCES modalities(id)
);

CREATE INDEX service_line_id_idx ON modality_configurations(service_line_id);

COMMENT ON TABLE modality_configurations IS 'Reference table for modality configurations';

COMMENT ON COLUMN modality_configurations.market_id IS 'Id of market used in configuration';

COMMENT ON COLUMN modality_configurations.insurance_plan_id IS 'Id of insurance plan used in configuration)';

COMMENT ON COLUMN modality_configurations.service_line_id IS 'Id of service-line used in configuration';

COMMENT ON COLUMN modality_configurations.modality_id IS 'Id of modality used in configuration, also used as foreign key';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE modality_configurations;

-- +goose StatementEnd
