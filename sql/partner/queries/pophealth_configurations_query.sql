-- name: AddPophealthConfiguration :one
INSERT INTO
    pophealth_configurations (partner_configuration_id, partner_id)
VALUES
    ($1, $2) RETURNING *;

-- name: DeletePophealthConfiguration :one
UPDATE
    pophealth_configurations
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: DeletePophealthConfigurationsByPartnerConfigurationID :many
UPDATE
    pophealth_configurations
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_id = sqlc.arg(partner_configuration_id)
    AND deleted_at IS NULL RETURNING *;

-- name: GetPophealthChannelItemsByPartnerConfigurationID :many
SELECT
    p.station_channel_item_id
FROM
    pophealth_configurations pc
    JOIN partners p ON pc.partner_id = p.id
WHERE
    pc.partner_configuration_id = $1
    AND pc.deleted_at IS NULL
    AND p.deactivated_at IS NULL;
