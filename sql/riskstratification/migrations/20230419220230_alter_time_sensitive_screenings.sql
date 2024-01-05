-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    time_sensitive_screenings
ALTER COLUMN
    escalated_question_id DROP NOT NULL,
ADD
    COLUMN survey_version_id uuid;

UPDATE
    time_sensitive_screenings
SET
    survey_version_id = '5a746af6-85fe-4123-8e75-5b09534e2430';

ALTER TABLE
    time_sensitive_screenings
ALTER COLUMN
    survey_version_id
SET
    NOT NULL;

COMMENT ON COLUMN time_sensitive_screenings.survey_version_id IS 'The survey version id that was used for secondary screening';

CREATE UNIQUE INDEX time_sensitive_screenings_care_request_survey_version_idx ON time_sensitive_screenings(care_request_id, survey_version_id);

DROP INDEX time_sensitive_screenings_care_request_idx;

ALTER TABLE
    time_sensitive_screenings
ADD
    CONSTRAINT time_sensitive_screenings_survey_version_id_fkey FOREIGN KEY (survey_version_id) REFERENCES time_sensitive_survey_versions(id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
CREATE UNIQUE INDEX time_sensitive_screenings_care_request_idx ON time_sensitive_screenings(care_request_id);

DROP INDEX time_sensitive_screenings_care_request_survey_version_idx;

ALTER TABLE
    time_sensitive_screenings DROP COLUMN survey_version_id;

-- Making escalated_question_id nullable is irreversible
-- +goose StatementEnd
