-- +goose Up
-- +goose StatementBegin
CREATE TABLE medical_decision_makers (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    phone_number TEXT NOT NULL DEFAULT '',
    address TEXT,
    relationship TEXT NOT NULL DEFAULT '',
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "medical_decision_makers_patient_id_idx" ON "public"."medical_decision_makers"("patient_id");

COMMENT ON COLUMN medical_decision_makers.first_name IS 'First name of the medical decision maker';

COMMENT ON COLUMN medical_decision_makers.last_name IS 'Last name of the medical decision maker';

COMMENT ON COLUMN medical_decision_makers.phone_number IS 'Phone number of the medical decision maker';

COMMENT ON COLUMN medical_decision_makers.address IS 'Full text address of the medical decision maker';

COMMENT ON COLUMN medical_decision_makers.relationship IS 'The type of relationship between the medical decision maker and the patient it is assigned to';

CREATE TABLE insurances (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    member_id BIGINT,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "insurances_patient_id_idx" ON "public"."insurances"("patient_id");

COMMENT ON COLUMN insurances.name IS 'Name of the insurance';

CREATE TABLE pharmacies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT,
    fax_number TEXT,
    address TEXT,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "pharmacies_patient_id_idx" ON "public"."pharmacies"("patient_id");

COMMENT ON COLUMN pharmacies.name IS 'Name of the pharmacy';

COMMENT ON COLUMN pharmacies.phone_number IS 'Phone number of the pharmacy';

COMMENT ON COLUMN pharmacies.fax_number IS 'Fax number of the pharmacy';

COMMENT ON COLUMN pharmacies.address IS 'Full text address of the pharmacy';

CREATE TABLE provider_types (id BIGSERIAL PRIMARY KEY, name TEXT);

INSERT INTO
    provider_types(name)
VALUES
    ('Other'),
    ('Doctor'),
    ('Referrer');

COMMENT ON COLUMN provider_types.name IS 'Name of the provider type';

CREATE TABLE external_care_providers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT,
    fax_number TEXT,
    address TEXT,
    provider_type_id TEXT NOT NULL,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "external_care_providers_patient_id_idx" ON "public"."external_care_providers"("patient_id");

COMMENT ON COLUMN external_care_providers.name IS 'Name of the external care provider';

COMMENT ON COLUMN external_care_providers.phone_number IS 'Phone number of the external care provider';

COMMENT ON COLUMN external_care_providers.fax_number IS 'Fax number of the external care provider';

COMMENT ON COLUMN external_care_providers.address IS 'Full text address of the external care provider';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE external_care_providers;

DROP TABLE provider_types;

DROP TABLE pharmacies;

DROP TABLE insurances;

DROP TABLE medical_decision_makers;

-- +goose StatementEnd
