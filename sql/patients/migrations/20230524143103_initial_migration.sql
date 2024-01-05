-- +goose Up
-- +goose StatementBegin
CREATE TYPE sex AS ENUM ('m', 'f', 'u');

CREATE TYPE gender_identity AS ENUM ('m', 'f', 'mtf', 'ftm', 'nb', 'u', 'other');

CREATE TABLE unverified_patients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    athena_id BIGINT,
    date_of_birth DATE NOT NULL,
    given_name TEXT NOT NULL,
    family_name TEXT NOT NULL,
    phone_number TEXT,
    legal_sex sex NOT NULL,
    birth_sex sex,
    gender_identity gender_identity,
    gender_identity_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE unverified_patients IS 'staging patients table used for accounts that do not have a verified assocation with a patient';

COMMENT ON COLUMN unverified_patients.athena_id IS 'athena id, used only for certain write operations. never exposed to caller.';

COMMENT ON COLUMN unverified_patients.gender_identity_details IS 'if gender identity is OTHER, then additional details are stored here';

COMMENT ON TYPE sex IS 'm=male, f=female, and u=unknown';

COMMENT ON TYPE gender_identity IS 'm=male, f=female, mtf=male-to-female, ftm=female-to-male, nb=nonbinary, u=unknown, and other=other';

CREATE INDEX unverified_patients_updated_at_idx ON unverified_patients (updated_at);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS unverified_patients;

DROP TYPE IF EXISTS gender_identity;

DROP TYPE IF EXISTS sex;

-- +goose StatementEnd
