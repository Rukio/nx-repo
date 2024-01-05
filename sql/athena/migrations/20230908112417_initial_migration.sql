-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

CREATE TABLE patients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id TEXT NOT NULL UNIQUE CHECK (patient_id != ''),
    dob TEXT NOT NULL CHECK (dob != ''),
    legal_sex TEXT,
    first_name TEXT NOT NULL CHECK (first_name != ''),
    last_name TEXT NOT NULL CHECK (last_name != ''),
    middle_name TEXT,
    suffix TEXT,
    alt_first_name TEXT,
    home_phone TEXT,
    mobile_phone TEXT,
    email TEXT,
    address_one TEXT,
    address_two TEXT,
    city TEXT,
    state_code TEXT,
    zip TEXT,
    contact_name TEXT,
    contact_relationship TEXT,
    contact_mobile_phone TEXT,
    guarantor_first_name TEXT,
    guarantor_middle_name TEXT,
    guarantor_last_name TEXT,
    guarantor_suffix TEXT,
    guarantor_dob TEXT,
    guarantor_phone TEXT,
    guarantor_email TEXT,
    guarantor_address_one TEXT,
    guarantor_address_two TEXT,
    guarantor_city TEXT,
    guarantor_state_code TEXT,
    guarantor_zip TEXT,
    guarantor_address_same_as_patient TEXT,
    guarantor_relationship_to_patient TEXT,
    department_id TEXT NOT NULL CHECK (department_id != ''),
    primary_provider_id TEXT,
    portal_access_given TEXT,
    gender_identity TEXT,
    gender_identity_other TEXT,
    birth_sex TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE patients IS 'Athena Service Patients table';

COMMENT ON COLUMN patients.patient_id IS 'Athena patient ID';

COMMENT ON COLUMN patients.dob IS 'Patient date of birth in mm/dd/yyyy format';

COMMENT ON COLUMN patients.legal_sex IS 'Legal sex of the patient, distinct from birth sex. Either M, F, or null';

COMMENT ON COLUMN patients.first_name IS 'First name of the patient';

COMMENT ON COLUMN patients.last_name IS 'Last name of the patient';

COMMENT ON COLUMN patients.middle_name IS 'Middle name of the patient';

COMMENT ON COLUMN patients.suffix IS 'Suffix of the patient name';

COMMENT ON COLUMN patients.alt_first_name IS 'Alternate first name of the patient';

COMMENT ON COLUMN patients.home_phone IS 'Home phone number of the patient. Stored in station as mobile_number';

COMMENT ON COLUMN patients.mobile_phone IS 'Mobile phone number of the patient. Stored in station as verified_mobile_number';

COMMENT ON COLUMN patients.email IS 'Email of the patient, or the string "declined" if patient declined to provide';

COMMENT ON COLUMN patients.address_one IS 'Patient address, first line';

COMMENT ON COLUMN patients.address_two IS 'Patient address, second line';

COMMENT ON COLUMN patients.city IS 'Patient address city';

COMMENT ON COLUMN patients.state_code IS 'Two letter abbreviation of the patient address state';

COMMENT ON COLUMN patients.zip IS 'Patient address zip code';

COMMENT ON COLUMN patients.contact_name IS 'Full name of the patient emergency contact';

COMMENT ON COLUMN patients.contact_relationship IS 'Relationship of the patient to the emergency contact. For example, if the contact is the parent of the patient, this would be PARENT and not CHILD';

COMMENT ON COLUMN patients.contact_mobile_phone IS 'Mobile phone number of the patient emergency contact';

COMMENT ON COLUMN patients.guarantor_first_name IS 'First name of the guarantor for the patient';

COMMENT ON COLUMN patients.guarantor_middle_name IS 'Middle name of the guarantor for the patient';

COMMENT ON COLUMN patients.guarantor_last_name IS 'Last name of the guarantor for the patient';

COMMENT ON COLUMN patients.guarantor_suffix IS 'Suffix of the name of the guarantor for the patient';

COMMENT ON COLUMN patients.guarantor_dob IS 'Date of birth of the guarantor for the patient, in mm/dd/yyyy format';

COMMENT ON COLUMN patients.guarantor_phone IS 'Phone number of the guarantor for the patient';

COMMENT ON COLUMN patients.guarantor_email IS 'Email of the guarantor for the patient';

COMMENT ON COLUMN patients.guarantor_address_one IS 'Guarantor address, first line';

COMMENT ON COLUMN patients.guarantor_address_two IS 'Guarantor address, second line';

COMMENT ON COLUMN patients.guarantor_city IS 'Guarantor address city';

COMMENT ON COLUMN patients.guarantor_state_code IS 'Two letter abbreviation of the Guarantor address state';

COMMENT ON COLUMN patients.guarantor_address_same_as_patient IS 'True if the guarantor address is the same as the patient address';

COMMENT ON COLUMN patients.guarantor_relationship_to_patient IS 'Relationship of the guarantor to the patient. Uses Athena Patient Relationship Mapping (https://docs.athenahealth.com/api/workflows/patient-relationship-mapping)';

COMMENT ON COLUMN patients.department_id IS 'Department ID that the patient is associated with';

COMMENT ON COLUMN patients.primary_provider_id IS 'ID of the primary provider for the patient';

COMMENT ON COLUMN patients.portal_access_given IS 'True if portal access has been given to the patient';

COMMENT ON COLUMN patients.gender_identity IS 'Gender identity of the patient, using 2015 Ed. CEHRT values';

COMMENT ON COLUMN patients.gender_identity_other IS 'Self-described gender identity of patient. Only valid when used in conjunction with a gender identity choice that allows the patient to describe their identity';

-- Use pg_trgm module to utilize trigrams for efficient search using similarity (%) operator
CREATE INDEX patients_full_name_idx ON patients USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX patients_alt_full_name_idx ON patients USING gin ((alt_first_name || ' ' || last_name) gin_trgm_ops);

-- Use metaphone to utilize sound matching, up to 15 chars.
CREATE INDEX patients_full_name_metaphone_idx ON patients (
    metaphone(first_name || ' ' || last_name, 15) text_pattern_ops
);

CREATE INDEX patients_alt_full_name_metaphone_idx ON patients (
    metaphone(alt_first_name || ' ' || last_name, 15) text_pattern_ops
);

-- Use dmetaphone_alt to utilize sound matching for non-english pronunciations
CREATE INDEX patients_first_name_dmetaphone_alt_idx ON patients (dmetaphone_alt(first_name));

CREATE INDEX patients_alt_first_name_dmetaphone_alt_idx ON patients (dmetaphone_alt(alt_first_name));

CREATE INDEX patients_last_name_dmetaphone_alt_idx ON patients (dmetaphone_alt(last_name));

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS patients;

DROP EXTENSION pg_trgm;

-- +goose StatementEnd
