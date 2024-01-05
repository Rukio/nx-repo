-- name: GenerateSymptomData :one
WITH SelectedSymptomAliases AS (
    SELECT
        sa.id AS alias_id,
        sa.name AS alias_name,
        s.id AS symptom_id,
        s.name AS symptom_name
    FROM
        symptom_aliases sa
        JOIN symptoms s ON sa.symptom_id = s.id
    WHERE
        sa.id IN (
            SELECT
                unnest(sqlc.arg(symptom_aliases_ids) :: UUID [ ])
        )
),
GroupedSymptomAliases AS (
    SELECT
        symptom_id,
        symptom_name,
        json_agg(
            json_build_object('id', alias_id, 'name', alias_name)
        ) AS agg_aliases
    FROM
        SelectedSymptomAliases
    GROUP BY
        symptom_id,
        symptom_name
)
SELECT
    json_build_object(
        'symptoms',
        json_agg(
            json_build_object(
                'id',
                symptom_id,
                'name',
                symptom_name,
                'aliases',
                agg_aliases
            )
        )
    ) AS SymptomData
FROM
    GroupedSymptomAliases;

-- name: UpsertCareRequestSymptoms :one
INSERT INTO
    care_request_symptoms (care_request_id, symptom_data, created_at)
VALUES
    (
        sqlc.arg(care_request_id),
        sqlc.arg(symptom_data) :: JSON,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (care_request_id) DO
UPDATE
SET
    symptom_data = EXCLUDED.symptom_data,
    updated_at = CURRENT_TIMESTAMP RETURNING *;

-- name: GetAllCareRequestSymptoms :many
SELECT
    *
FROM
    care_request_symptoms
ORDER BY
    created_at DESC;

-- name: GetCareRequestSymptomsById :one
SELECT
    *
FROM
    care_request_symptoms
WHERE
    care_request_id = sqlc.arg(care_request_id)
LIMIT
    1;
