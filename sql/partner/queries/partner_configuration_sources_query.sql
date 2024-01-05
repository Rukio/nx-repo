-- name: GetPartnerConfigurationSourcesByPartnerConfigurationID :many
SELECT
    pcs.*,
    co.slug default_callback_option_slug,
    co.display_name default_callback_option_display_name,
    l.address_line_one,
    l.address_line_two,
    l.city,
    l.state_code,
    l.zip_code
FROM
    partner_configuration_sources pcs
    JOIN callback_options co ON pcs.default_callback_option_id = co.id
    LEFT JOIN locations l ON pcs.location_id = l.id
WHERE
    pcs.deleted_at IS NULL
    AND pcs.partner_configuration_id = $1;

-- name: GetPartnerConfigurationSourceByID :one
SELECT
    pcs.*,
    co.slug default_callback_option_slug,
    co.display_name default_callback_option_display_name,
    l.address_line_one,
    l.address_line_two,
    l.city,
    l.state_code,
    l.zip_code
FROM
    partner_configuration_sources pcs
    JOIN callback_options co ON pcs.default_callback_option_id = co.id
    LEFT JOIN locations l ON pcs.location_id = l.id
WHERE
    pcs.id = $1
    AND pcs.deleted_at IS NULL;

-- name: GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationID :one
SELECT
    *
FROM
    partner_configuration_sources
WHERE
    partner_id = $1
    AND partner_configuration_id = $2
    AND deleted_at IS NULL
LIMIT
    1;

-- name: AddPartnerConfigurationSource :one
INSERT INTO
    partner_configuration_sources (
        partner_id,
        partner_configuration_id,
        callback_number_country_code,
        callback_number,
        callback_number_extension,
        location_id,
        default_callback_option_id
    )
VALUES
    (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        (
            SELECT
                id
            FROM
                callback_options
            WHERE
                slug = sqlc.arg(default_callback_option_slug)
        )
    ) RETURNING *;

-- name: UpdatePartnerConfigurationSource :one
UPDATE
    partner_configuration_sources AS pcs
SET
    partner_id = sqlc.arg(partner_id),
    callback_number_country_code = sqlc.arg(callback_number_country_code),
    callback_number = sqlc.arg(callback_number),
    callback_number_extension = sqlc.arg(callback_number_extension),
    updated_at = CURRENT_TIMESTAMP,
    default_callback_option_id = (
        SELECT
            co.id
        FROM
            callback_options co
        WHERE
            co.slug = sqlc.arg(default_callback_option_slug)
    )
WHERE
    pcs.id = sqlc.arg(id)
    AND pcs.deleted_at IS NULL RETURNING *;

-- name: DeletePartnerConfigurationSource :one
UPDATE
    partner_configuration_sources
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = $1
    AND deleted_at IS NULL RETURNING *;

-- name: DeletePartnerConfigurationSourcesByPartnerConfigurationID :many
UPDATE
    partner_configuration_sources
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_id = $1
    AND deleted_at IS NULL RETURNING *;
