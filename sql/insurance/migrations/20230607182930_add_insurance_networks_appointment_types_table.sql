-- +goose Up
-- +goose StatementBegin
CREATE TABLE insurance_networks_appointment_types(
    id BIGSERIAL PRIMARY KEY,
    network_id BIGINT NOT NULL,
    service_line_id BIGINT NOT NULL,
    modality_type TEXT NOT NULL,
    new_patient_appointment_type TEXT NOT NULL,
    existing_patient_appointment_type TEXT NOT NULL
);

CREATE INDEX insurance_networks_appointment_types_network_id_idx ON insurance_networks_appointment_types(network_id);

CREATE INDEX insurance_networks_appointment_types_service_line_id_idx ON insurance_networks_appointment_types(service_line_id);

COMMENT ON TABLE insurance_networks_appointment_types IS 'Reference table for insurance networks Athena appointment types';

COMMENT ON COLUMN insurance_networks_appointment_types.network_id IS 'ID of insurance network';

COMMENT ON COLUMN insurance_networks_appointment_types.service_line_id IS 'ID of the station service-line';

COMMENT ON COLUMN insurance_networks_appointment_types.modality_type IS 'Represents type of modality associated with appointment types';

COMMENT ON COLUMN insurance_networks_appointment_types.new_patient_appointment_type IS 'Athena appointment type for new patient';

COMMENT ON COLUMN insurance_networks_appointment_types.existing_patient_appointment_type IS 'Athena appointment type for existing patient';

COMMENT ON INDEX insurance_networks_appointment_types_network_id_idx IS 'Lookup index for insurance_networks_appointment_types by network_id';

COMMENT ON INDEX insurance_networks_appointment_types_service_line_id_idx IS 'Lookup index for insurance_networks_appointment_types by service_line_id';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE insurance_networks_appointment_types;

-- +goose StatementEnd
