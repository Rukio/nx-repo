-- name: GetPartnerByID :one
SELECT
    p.id,
    p.station_channel_item_id,
    p.station_channel_id,
    p.display_name,
    p.phone_country_code,
    p.phone_number,
    p.phone_extension,
    p.email,
    l.address_line_one,
    l.address_line_two,
    l.city,
    l.state_code,
    l.zip_code,
    l.latitude_e6,
    l.longitude_e6,
    p.deactivated_at,
    p.updated_at,
    p.created_at,
    c.short_name partner_category_short_name
FROM
    partners p
    LEFT JOIN partner_categories c ON p.partner_category_id = c.id
    LEFT JOIN locations l ON p.location_id = l.id
WHERE
    p.id = $1;

-- name: GetPartnerByStationChannelItemID :one
SELECT
    *
FROM
    partners
WHERE
    station_channel_item_id = $1;

-- name: GetPartnersByStationChannelItemIDList :many
SELECT
    *
FROM
    partners
WHERE
    station_channel_item_id = ANY(sqlc.arg(station_channel_item_ids) :: BIGINT [ ])
    AND deactivated_at IS NULL;

-- name: AddPartner :one
INSERT INTO
    partners (
        station_channel_item_id,
        station_channel_id,
        display_name,
        location_id,
        partner_category_id
    )
VALUES
    (
        $1,
        $2,
        $3,
        $4,
        (
            SELECT
                id
            FROM
                partner_categories
            WHERE
                short_name = sqlc.arg(partner_category_short_name)
        )
    ) RETURNING *;

-- name: UpdatePartner :one
UPDATE
    partners
SET
    display_name = sqlc.arg(display_name),
    phone_country_code = sqlc.arg(phone_country_code),
    phone_number = sqlc.arg(phone_number),
    phone_extension = sqlc.arg(phone_extension),
    email = sqlc.arg(email),
    deactivated_at = sqlc.arg(deactivated_at),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: DeactivatePartnerByID :one
UPDATE
    partners
SET
    deactivated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: SearchPartnersByName :many
SELECT
    p.id,
    p.station_channel_item_id,
    p.station_channel_id,
    p.display_name,
    p.phone_country_code,
    p.phone_number,
    p.phone_extension,
    p.email,
    l.address_line_one,
    l.address_line_two,
    l.city,
    l.state_code,
    l.zip_code,
    l.latitude_e6,
    l.longitude_e6,
    p.deactivated_at,
    p.updated_at,
    p.created_at,
    c.short_name partner_category_short_name
FROM
    partners p
    LEFT JOIN partner_categories c ON p.partner_category_id = c.id
    LEFT JOIN locations l ON p.location_id = l.id
WHERE
    p.display_name ILIKE CONCAT('%', sqlc.arg(partner_name) :: TEXT, '%')
    AND p.deactivated_at IS NULL
ORDER BY
    p.display_name
LIMIT
    sqlc.arg(max_result_count);

-- name: SearchPartnersByLatLng :many
SELECT
    p.*,
    c.short_name partner_category_short_name
FROM
    partners p
    LEFT JOIN partner_categories c ON p.partner_category_id = c.id
    LEFT JOIN locations l ON p.location_id = l.id
WHERE
    l.latitude_e6 > sqlc.arg(lat_e6_min)
    AND l.latitude_e6 < sqlc.arg(lat_e6_max)
    AND l.longitude_e6 > sqlc.arg(lng_e6_min)
    AND l.longitude_e6 < sqlc.arg(lng_e6_max)
    AND p.deactivated_at IS NULL;

-- name: GetPartnersByInsurancePackages :many
SELECT
    par.*
FROM
    partners par
    JOIN partner_insurance_packages pip ON par.id = pip.partner_id
WHERE
    par.deactivated_at IS NULL
    AND pip.package_id = ANY(sqlc.arg(package_id) :: BIGINT [ ]);
