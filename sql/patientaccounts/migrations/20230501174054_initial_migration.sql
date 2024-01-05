-- +goose Up
-- +goose StatementBegin
CREATE TABLE accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auth0_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    given_name TEXT,
    family_name TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE accounts IS 'account information for patients and patient-adjacent users requesting care';

CREATE INDEX accounts_auth0_id_idx ON accounts (auth0_id);

CREATE INDEX accounts_phone_number_idx ON accounts (phone_number);

CREATE INDEX accounts_updated_at_idx ON accounts (updated_at);

CREATE INDEX accounts_name_idx ON accounts (family_name, given_name);

CREATE TABLE addresses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id BIGINT NOT NULL,
    address_line_one TEXT,
    address_line_two TEXT,
    city TEXT,
    state_code TEXT,
    zipcode TEXT,
    location_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

COMMENT ON TABLE addresses IS 'addresses previously used by a patient account';

COMMENT ON COLUMN addresses.location_details IS 'miscellaneous information about the address (ex: gate code, parking instructions, etc.)';

CREATE INDEX addresses_account_id_idx ON addresses (account_id);

CREATE INDEX addresses_updated_at_idx ON addresses (updated_at);

CREATE TABLE account_care_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id BIGINT NOT NULL,
    care_request_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

COMMENT ON TABLE account_care_requests IS 'mapping table of which accounts created which care requests';

CREATE INDEX account_care_request_idx ON account_care_requests (care_request_id);

CREATE INDEX account_care_request_updated_at_idx ON account_care_requests (updated_at);

CREATE TYPE access_level AS ENUM ('self', 'phi');

CREATE TABLE account_patients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id BIGINT NOT NULL,
    patient_id BIGINT,
    unverified_patient_id BIGINT,
    access_level access_level NOT NULL,
    consenting_relationship TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE,
    CHECK (
        (
            patient_id IS NOT NULL
            OR unverified_patient_id IS NOT NULL
        )
        AND (
            patient_id IS NULL
            OR unverified_patient_id IS NULL
        )
    )
);

COMMENT ON TABLE account_patients IS 'mapping table of which accounts have what access to which patients';

COMMENT ON COLUMN account_patients.patient_id IS 'patient ID for this account, which maps to the *company-data-covered* patient ID. exactly one of patient_id and unverified_patient_id must be NULL';

COMMENT ON COLUMN account_patients.unverified_patient_id IS 'unverified patient ID for this account, which maps to a table in patients service. exactly one of patient_id and unverified_patient_id must be NULL';

COMMENT ON COLUMN account_patients.access_level IS 'access level that the account has to the patient. only valid enum values (for the "access_level" enum) are allowed values.';

COMMENT ON COLUMN account_patients.consenting_relationship IS 'relationship that the account holder has to the patient.';

CREATE INDEX account_patients_idx ON account_patients (patient_id, deleted_at);

CREATE INDEX account_unverified_patients_idx ON account_patients (unverified_patient_id, deleted_at);

CREATE INDEX account_patients_updated_at_idx ON account_patients (updated_at);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS account_patients;

DROP TYPE IF EXISTS access_level;

DROP TABLE IF EXISTS account_care_requests;

DROP TABLE IF EXISTS addresses;

DROP TABLE IF EXISTS accounts;

-- +goose StatementEnd
