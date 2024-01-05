-- name: SearchSymptomAliases :many
SELECT
    sa.id,
    sa.symptom_id,
    sa.name,
    s.name AS symptom_name,
    lp.name AS legacy_risk_protocol_name
FROM
    symptom_aliases sa
    INNER JOIN symptoms s ON s.id = sa.symptom_id
    LEFT JOIN legacy_risk_protocols lp ON lp.id = s.legacy_risk_protocol_id
WHERE
    sa.name ILIKE CONCAT('%', sqlc.arg(search_term) :: TEXT, '%')
    AND sa.deleted_at IS NULL
ORDER BY
    similarity(sqlc.arg(search_term) :: TEXT, sa.name) DESC
LIMIT
    sqlc.arg(page_size) :: BIGINT OFFSET sqlc.arg(page_offset) :: BIGINT;

-- name: UpsertSymptom :one
WITH create_symptom AS (
    INSERT INTO
        symptoms(name)
    VALUES
        ($1) ON CONFLICT (name) DO
    UPDATE
    SET
        name = EXCLUDED.name RETURNING *
)
INSERT INTO
    symptom_aliases(symptom_id, name)
SELECT
    id,
    name
FROM
    create_symptom ON CONFLICT(name) DO
UPDATE
SET
    name = EXCLUDED.name RETURNING *;

-- name: CountSymptomAliases :one
SELECT
    COUNT(*)
FROM
    symptom_aliases sa
    INNER JOIN symptoms s ON s.id = sa.symptom_id
    LEFT JOIN legacy_risk_protocols lp ON lp.id = s.legacy_risk_protocol_id
WHERE
    sa.name ILIKE CONCAT('%', sqlc.arg(search_term) :: TEXT, '%')
    AND sa.deleted_at IS NULL;

-- name: GetSymptom :one
SELECT
    symptoms.*
FROM
    symptoms
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: GetAllSymptoms :many
SELECT
    symptoms.*
FROM
    symptoms
WHERE
    deleted_at IS NULL
ORDER BY
    created_at DESC;

-- name: GetSymptomAliases :many
SELECT
    symptom_aliases.*
FROM
    symptom_aliases
WHERE
    symptom_id = $1
    AND deleted_at IS NULL
ORDER BY
    created_at DESC;

-- name: DeleteSymptom :many
WITH deleted_symptom AS(
    UPDATE
        symptoms s
    SET
        s.deleted_at = CURRENT_TIMESTAMP
    WHERE
        s.id = sqlc.arg(id)
        AND s.deleted_at IS NULL RETURNING *
)
UPDATE
    symptom_aliases sa
SET
    sa.deleted_at = CURRENT_TIMESTAMP
WHERE
    sa.symptom_id = deleted_symptom.id RETURNING *;

-- name: DeleteSymptomAlias :one
UPDATE
    symptom_aliases
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: CheckSymptomAliasIDsExist :one
SELECT
    COUNT(*) = array_length(sqlc.arg(symptom_aliases_ids) :: UUID [ ], 1) AS all_exist
FROM
    symptom_aliases
WHERE
    id = ANY(sqlc.arg(symptom_aliases_ids) :: UUID [ ])
    AND deleted_at IS NULL;
