-- name: CreateInsurancePayer :one
INSERT INTO
    insurance_payers(name, notes, payer_group_id, is_active)
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: GetInsurancePayers :many
SELECT
    *
FROM
    insurance_payers
WHERE
    deleted_at IS NULL
ORDER BY
    name;

-- name: GetInsurancePayersWithFilterAndOrder :many
SELECT
    insurance_payers.*
FROM
    insurance_payers
    LEFT JOIN insurance_networks ON insurance_payers.id = insurance_networks.insurance_payer_id
    LEFT JOIN insurance_network_states ON insurance_networks.id = insurance_network_states.insurance_network_id
WHERE
    insurance_payers.name ILIKE CONCAT('%', LOWER(sqlc.arg(search_string) :: TEXT), '%')
    AND insurance_payers.deleted_at IS NULL
    AND (
        sqlc.narg(filter_states) :: TEXT [ ] IS NULL
        OR insurance_network_states.state_abbr = ANY(sqlc.narg(filter_states) :: TEXT [ ])
    )
GROUP BY
    insurance_payers.id,
    insurance_payers.name,
    insurance_payers.updated_at
ORDER BY
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'name'
        AND sqlc.arg(sort_direction) :: TEXT = 'asc' THEN LOWER(insurance_payers.name)
    END ASC,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'name'
        AND sqlc.arg(sort_direction) :: TEXT = 'desc' THEN LOWER(insurance_payers.name)
    END DESC,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'updated_at'
        AND sqlc.arg(sort_direction) :: TEXT = 'asc' THEN insurance_payers.updated_at
    END ASC,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'updated_at'
        AND sqlc.arg(sort_direction) :: TEXT = 'desc' THEN insurance_payers.updated_at
    END DESC;

-- name: GetInsurancePayer :one
SELECT
    *
FROM
    insurance_payers
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: UpdateInsurancePayer :one
UPDATE
    insurance_payers
SET
    name = sqlc.arg(name),
    notes = sqlc.arg(notes),
    payer_group_id = sqlc.arg(payer_group_id),
    is_active = sqlc.arg(is_active),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: DeleteInsurancePayer :one
UPDATE
    insurance_payers
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;
