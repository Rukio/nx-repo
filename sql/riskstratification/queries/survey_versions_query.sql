-- name: AddSurveyVersion :one
INSERT INTO
    time_sensitive_survey_versions DEFAULT
VALUES
    RETURNING *;

-- name: GetTimeSensitiveSurveyVersions :many
SELECT
    time_sensitive_survey_versions.*
FROM
    time_sensitive_survey_versions
ORDER BY
    created_at DESC;
