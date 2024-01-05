-- +goose Up
-- +goose StatementBegin
CREATE TABLE insurance_payers(
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    payer_group_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE insurance_payers IS 'Insurance Payer records table';

COMMENT ON COLUMN insurance_payers.id IS 'The unique ID of the insurance payer record';

COMMENT ON COLUMN insurance_payers.name IS 'The name of the insurance payer';

COMMENT ON COLUMN insurance_payers.notes IS 'The notes about insurance payer';

COMMENT ON COLUMN insurance_payers.is_active IS 'Active state of the Insurance Payer';

COMMENT ON COLUMN insurance_payers.payer_group_id IS 'The ID of the payer group that the insurance payer are associated with';

COMMENT ON COLUMN insurance_payers.created_at IS 'Point in time when the record was created';

COMMENT ON COLUMN insurance_payers.updated_at IS 'Point in time when the record was updated';

COMMENT ON COLUMN insurance_payers.deleted_at IS 'Point in time when the record was deleted';

CREATE INDEX insurance_payers_name_idx ON insurance_payers(name ASC);

COMMENT ON INDEX insurance_payers_name_idx IS 'Lookup index on insurance payer by name of payer';

CREATE TABLE insurance_networks(
    id BIGSERIAL PRIMARY KEY,
    notes TEXT,
    insurance_plan_id BIGINT NOT NULL,
    insurance_payer_id BIGINT NOT NULL,
    address TEXT,
    zipcode TEXT,
    city TEXT,
    state TEXT,
    eligibility_check_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    provider_enrollment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY ("insurance_payer_id") REFERENCES insurance_payers("id")
);

COMMENT ON TABLE insurance_networks IS 'Insurance Network records table';

COMMENT ON COLUMN insurance_networks.id IS 'The unique ID of the Insurance Network record';

COMMENT ON COLUMN insurance_networks.notes IS 'The notes about Insurance Network';

COMMENT ON COLUMN insurance_networks.insurance_plan_id IS 'Insurance plan of the Insurance Network';

COMMENT ON COLUMN insurance_networks.insurance_payer_id IS 'Reference to the Insurance Payer to which the Insurance Network belongs to';

COMMENT ON COLUMN insurance_networks.address IS 'The address at which the Insurance claim for the patient is sent';

COMMENT ON COLUMN insurance_networks.zipcode IS 'The zipcode at which the Insurance claim for the patient is sent';

COMMENT ON COLUMN insurance_networks.city IS 'The city at which the Insurance claim for the patient is sent';

COMMENT ON COLUMN insurance_networks.state IS 'The state at which the Insurance claim for the patient is sent';

COMMENT ON COLUMN insurance_networks.eligibility_check_enabled IS 'Enables eligibility check for the Insurance Network';

COMMENT ON COLUMN insurance_networks.provider_enrollment_enabled IS 'Enables provider enrollment for the Insurance Network';

COMMENT ON COLUMN insurance_networks.is_active IS 'Active state of the Insurance Network';

COMMENT ON COLUMN insurance_networks.created_at IS 'Point in time when the record was created';

COMMENT ON COLUMN insurance_networks.updated_at IS 'Point in time when the record was updated';

COMMENT ON COLUMN insurance_networks.deleted_at IS 'Point in time when the record was deleted';

CREATE TABLE insurance_network_states(
    id BIGSERIAL PRIMARY KEY,
    insurance_network_id BIGINT NOT NULL,
    state_id BIGINT NOT NULL
);

COMMENT ON TABLE insurance_network_states IS 'Insurance Network associated with states';

COMMENT ON COLUMN insurance_network_states.id IS 'The unique ID of the Insurance Network States record';

COMMENT ON COLUMN insurance_network_states.insurance_network_id IS 'Reference to the Insurance Network to which the Insurance Network States belongs to';

COMMENT ON COLUMN insurance_network_states.state_id IS 'Reference to the State ID in station to which the Insurance Network belongs to';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE insurance_network_states;

DROP TABLE insurance_networks;

DROP TABLE insurance_payers;

-- +goose StatementEnd
