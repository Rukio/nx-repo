-- +goose Up
-- +goose StatementBegin
CREATE TABLE insurance_network_address(
    id BIGSERIAL PRIMARY KEY,
    insurance_network_id BIGINT NOT NULL,
    address TEXT NOT NULL,
    zipcode TEXT NOT NULL,
    city TEXT NOT NULL,
    billing_state TEXT NOT NULL,
    FOREIGN KEY ("insurance_network_id") REFERENCES insurance_networks("id")
);

CREATE INDEX insurance_network_address_insurance_network_id_idx ON insurance_network_address(insurance_network_id);

COMMENT ON TABLE insurance_network_address IS 'Insurance Network associated with address';

COMMENT ON COLUMN insurance_network_address.id IS 'The unique ID of the Insurance Network Address record';

COMMENT ON COLUMN insurance_network_address.address IS 'The address to which the Insurance claim for the patient is sent';

COMMENT ON COLUMN insurance_network_address.zipcode IS 'The zipcode to which the Insurance claim for the patient is sent';

COMMENT ON COLUMN insurance_network_address.city IS 'The city to which the Insurance claim for the patient is sent';

COMMENT ON COLUMN insurance_network_address.billing_state IS 'The billing state to which the Insurance claim for the patient is sent';

COMMENT ON INDEX insurance_network_address_insurance_network_id_idx IS 'Lookup index for insurance_network_address by insurance_network_id';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE insurance_network_address;

-- +goose StatementEnd
