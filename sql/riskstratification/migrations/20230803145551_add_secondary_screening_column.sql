-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    time_sensitive_screenings
ADD
    COLUMN secondary_screening_id BIGINT;

COMMENT ON COLUMN time_sensitive_screenings.secondary_screening_id IS 'Secondary Screening Id from Station Database';

CREATE UNIQUE INDEX care_request_screening_survey_idx ON time_sensitive_screenings(
    care_request_id,
    survey_version_id,
    secondary_screening_id
)
WHERE
    secondary_screening_id IS NOT NULL;

CREATE UNIQUE INDEX care_request_survey_idx ON time_sensitive_screenings(care_request_id, survey_version_id)
WHERE
    secondary_screening_id IS NULL;

DROP INDEX IF EXISTS time_sensitive_screenings_care_request_survey_version_idx;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX care_request_survey_idx;

DROP INDEX care_request_screening_survey_idx;

ALTER TABLE
    time_sensitive_screenings DROP COLUMN secondary_screening_id;

-- Delete duplicate entries excluding most recently updated rows.
WITH care_requests AS (
    SELECT
        care_request_id,
        survey_version_id,
        max(updated_at) AS max_updated
    FROM
        time_sensitive_screenings
    GROUP BY
        care_request_id,
        survey_version_id
)
DELETE FROM
    time_sensitive_screenings s USING care_requests
WHERE
    s.care_request_id = care_requests.care_request_id
    AND s.updated_at <> max_updated;

CREATE UNIQUE INDEX time_sensitive_screenings_care_request_survey_version_idx ON time_sensitive_screenings(care_request_id, survey_version_id);

-- +goose StatementEnd
