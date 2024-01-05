-- +goose Up
-- +goose StatementBegin
CREATE TABLE episodes (
    id BIGSERIAL PRIMARY KEY,
    care_day BIGINT DEFAULT 0,
    admitted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    discharged_at TIMESTAMP WITHOUT TIME ZONE,
    source TEXT,
    patient_summary TEXT NOT NULL,
    primary_diagnosis TEXT,
    payer TEXT,
    doctors_primary_care TEXT,
    patient_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

COMMENT ON TABLE episodes IS 'CareManager Episode table';

COMMENT ON COLUMN episodes.care_day IS 'Number of days the patient has been receiving care';

COMMENT ON COLUMN episodes.admitted_at IS 'Date on which the patient was admitted';

COMMENT ON COLUMN episodes.discharged_at IS 'Date on which the patient was discharged';

COMMENT ON COLUMN episodes.source IS 'Referral source of episode';

COMMENT ON COLUMN episodes.patient_summary IS 'Most relevant patient information for the episode';

COMMENT ON COLUMN episodes.primary_diagnosis IS 'Primary diagnosis of the patient';

COMMENT ON COLUMN episodes.payer IS 'Insurance payer of the episode';

COMMENT ON COLUMN episodes.doctors_primary_care IS 'Primary care doctors';

COMMENT ON COLUMN episodes.patient_id IS 'Patient ID of the episode';

COMMENT ON COLUMN episodes.deleted_at IS 'Date of deletion of the episode';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE episodes;

-- +goose StatementEnd
