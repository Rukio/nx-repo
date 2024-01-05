-- +goose Up
-- +goose StatementBegin
CREATE TABLE provider_visits(
    id bigserial PRIMARY KEY,
    care_request_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    patient_first_name TEXT NOT NULL,
    patient_last_name TEXT NOT NULL,
    patient_athena_id TEXT NOT NULL,
    service_date DATE NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    is_abx_prescribed BOOLEAN NOT NULL DEFAULT FALSE,
    abx_details TEXT,
    is_escalated BOOLEAN NOT NULL DEFAULT FALSE,
    escalated_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(care_request_id, provider_id)
);

COMMENT ON TABLE provider_visits IS 'Provider`s visits across all markets for the latest 80 days.';

COMMENT ON COLUMN provider_visits.care_request_id IS 'The unique ID of the care request.';

COMMENT ON COLUMN provider_visits.provider_id IS 'The station user ID of the provider.';

COMMENT ON COLUMN provider_visits.patient_first_name IS 'First name of the Patient of the visit.';

COMMENT ON COLUMN provider_visits.patient_last_name IS 'Last name of the Patient of the visit.';

COMMENT ON COLUMN provider_visits.patient_athena_id IS 'Athena ID of the Patient of the visit.';

COMMENT ON COLUMN provider_visits.service_date IS 'Date the visit was made.';

COMMENT ON COLUMN provider_visits.chief_complaint IS 'Patient`s chief complaint.';

COMMENT ON COLUMN provider_visits.diagnosis IS 'Diagnosis that was established.';

COMMENT ON COLUMN provider_visits.is_abx_prescribed IS 'Flag that shows if antibiotics were prescribed.';

COMMENT ON COLUMN provider_visits.abx_details IS 'Details about antibiotics that were prescribed.';

COMMENT ON COLUMN provider_visits.is_escalated IS 'Flag that shows if the visit was escalated.';

COMMENT ON COLUMN provider_visits.escalated_reason IS 'Reason why the visit was escalated.';

CREATE INDEX provider_visits_provider_id_idx ON provider_visits(provider_id);

COMMENT ON INDEX provider_visits_provider_id_idx IS 'Index of leader hub provider visits provider IDs.';

CREATE INDEX provider_visits_provider_id_patient_athena_id_patient_first_name_patient_last_name_idx ON provider_visits(
    provider_id,
    patient_athena_id,
    patient_first_name,
    patient_last_name
);

COMMENT ON INDEX provider_visits_provider_id_patient_athena_id_patient_first_name_patient_last_name_idx IS 'Index of leader hub provider visits provider IDs, patient athena IDs and patient names.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS provider_visits;

-- +goose StatementEnd
