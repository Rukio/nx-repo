-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    insurance_network_address RENAME TO insurance_network_addresses;

ALTER INDEX insurance_network_address_insurance_network_id_idx RENAME TO insurance_network_addresses_insurance_network_id_idx;

COMMENT ON TABLE insurance_network_addresses IS 'Addresses associated with Insurance Networks';

COMMENT ON INDEX insurance_network_addresses_insurance_network_id_idx IS 'Lookup index for insurance_network_addresses by insurance_network_id';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    insurance_network_addresses RENAME TO insurance_network_address;

ALTER INDEX insurance_network_addresses_insurance_network_id_idx RENAME TO insurance_network_address_insurance_network_id_idx;

COMMENT ON TABLE insurance_network_address IS 'Insurance Network associated with address';

COMMENT ON INDEX insurance_network_address_insurance_network_id_idx IS 'Lookup index for insurance_network_address by insurance_network_id';

-- +goose StatementEnd
