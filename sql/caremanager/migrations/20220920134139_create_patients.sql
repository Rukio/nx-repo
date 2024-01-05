-- +goose Up
-- +goose StatementBegin
CREATE TABLE patients (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    sex TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    phone_number TEXT,
    athena_medical_record_number TEXT,
    medical_power_of_attorney_details TEXT,
    payer TEXT,
    preferred_pharmacy_details TEXT,
    referrer TEXT,
    doctor_details TEXT,
    address_street TEXT,
    address_street_2 TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zipcode TEXT,
    address_notes TEXT,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE patients IS 'CareManager Patient table';

COMMENT ON COLUMN patients.first_name IS 'First name of the patient';

COMMENT ON COLUMN patients.middle_name IS 'Middle name of the patient';

COMMENT ON COLUMN patients.last_name IS 'Last name of the patient';

COMMENT ON COLUMN patients.sex IS 'Sex of the patient';

COMMENT ON COLUMN patients.date_of_birth IS 'Date of birth of the patient';

COMMENT ON COLUMN patients.phone_number IS 'Phone number of the patient';

COMMENT ON COLUMN patients.athena_medical_record_number IS 'Athena Medical Record number of the patient';

COMMENT ON COLUMN patients.medical_power_of_attorney_details IS 'Details related to any medical power of attorney of the patient';

COMMENT ON COLUMN patients.payer IS 'Payer of the patient, usually referring to insurance';

COMMENT ON COLUMN patients.preferred_pharmacy_details IS 'Details related to any preferred pharmacy of the patient';

COMMENT ON COLUMN patients.referrer IS 'Referrer of the patient';

COMMENT ON COLUMN patients.doctor_details IS 'Doctor details of the patient';

COMMENT ON COLUMN patients.address_street IS 'Patient address street';

COMMENT ON COLUMN patients.address_street_2 IS 'Patient address street (second line)';

COMMENT ON COLUMN patients.address_city IS 'Patient address city';

COMMENT ON COLUMN patients.address_state IS 'Patient address state';

COMMENT ON COLUMN patients.address_zipcode IS 'Patient address zipcode';

COMMENT ON COLUMN patients.address_notes IS 'Patient address notes';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE patients;

-- +goose StatementEnd
