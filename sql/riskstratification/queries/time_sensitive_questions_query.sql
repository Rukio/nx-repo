-- name: GetTimeSensitiveQuestions :many
SELECT
    time_sensitive_questions.*
FROM
    time_sensitive_questions
WHERE
    survey_version_id = $1
ORDER BY
    display_order ASC;

-- name: GetTimeSensitiveQuestion :one
SELECT
    time_sensitive_questions.*
FROM
    time_sensitive_questions
WHERE
    id = $1
ORDER BY
    display_order ASC;

-- name: GetLatestTimeSensitiveQuestions :many
SELECT
    time_sensitive_questions.*
FROM
    time_sensitive_questions
WHERE
    survey_version_id = (
        SELECT
            id
        FROM
            time_sensitive_survey_versions
        ORDER BY
            created_at DESC
        LIMIT
            1
    )
ORDER BY
    display_order ASC;

-- name: UpsertTimeSensitiveScreeningResult :one
-- Deprecated. TODO: Remove.
INSERT INTO
    time_sensitive_screenings (
        care_request_id,
        escalated,
        escalated_question_id,
        survey_version_id
    )
VALUES
    ($1, $2, $3, $4) ON CONFLICT (care_request_id, survey_version_id)
WHERE
    secondary_screening_id IS NULL DO
UPDATE
SET
    escalated = EXCLUDED.escalated,
    escalated_question_id = EXCLUDED.escalated_question_id,
    updated_at = CURRENT_TIMESTAMP RETURNING *;

-- name: UpsertTimeSensitiveScreeningResultWithSecondaryScreening :one
INSERT INTO
    time_sensitive_screenings (
        care_request_id,
        escalated,
        escalated_question_id,
        survey_version_id,
        secondary_screening_id
    )
VALUES
    ($1, $2, $3, $4, $5) ON CONFLICT (
        care_request_id,
        survey_version_id,
        secondary_screening_id
    )
WHERE
    secondary_screening_id IS NOT NULL DO
UPDATE
SET
    escalated = EXCLUDED.escalated,
    escalated_question_id = EXCLUDED.escalated_question_id,
    updated_at = CURRENT_TIMESTAMP RETURNING *;

-- name: GetTimeSensitiveScreeningResult :one
-- Deprecated.  TODO: Remove.
SELECT
    time_sensitive_screenings.*
FROM
    time_sensitive_screenings
WHERE
    care_request_id = $1
ORDER BY
    updated_at DESC;

-- name: GetTimeSensitiveScreenings :many
SELECT
    sqlc.embed(s),
    sqlc.embed(q)
FROM
    time_sensitive_screenings s
    LEFT JOIN time_sensitive_questions q ON q.id = s.escalated_question_id
WHERE
    s.care_request_id = $1
ORDER BY
    s.updated_at DESC;

-- name: GetTimeSensitiveScreening :one
SELECT
    time_sensitive_screenings.*
FROM
    time_sensitive_screenings
WHERE
    care_request_id = $1
    AND secondary_screening_id = $2;

-- name: GetTimeSensitiveQuestionsFromDisplayOrder :many
-- Returns a list of questions from a survey version up to the display order.
-- This is useful when Secondary Screening was escalated, and we have the
-- escalated_question_id.
SELECT
    time_sensitive_questions.*
FROM
    time_sensitive_questions
WHERE
    display_order <= (
        SELECT
            display_order
        FROM
            time_sensitive_questions
        WHERE
            time_sensitive_questions.id = $1
    )
    AND survey_version_id = (
        SELECT
            survey_version_id
        FROM
            time_sensitive_questions
        WHERE
            time_sensitive_questions.id = $1
    )
ORDER BY
    display_order ASC;
