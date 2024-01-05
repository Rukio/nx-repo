-- name: AddCareRequestPartner :one
INSERT INTO
    care_request_partners (
        station_care_request_id,
        partner_id,
        care_request_partner_origin_id
    )
VALUES
    (
        $1,
        $2,
        (
            SELECT
                id
            FROM
                care_request_partner_origins
            WHERE
                slug = sqlc.arg(care_request_partner_origin_slug)
        )
    ) RETURNING *;

-- name: DeleteCareRequestPartner :one
UPDATE
    care_request_partners
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: GetCareRequestPartnersByStationCareRequestID :many
SELECT
    crp.*,
    crpo.slug care_request_partner_origin_slug
FROM
    care_request_partners crp
    JOIN care_request_partner_origins crpo ON crp.care_request_partner_origin_id = crpo.id
WHERE
    crp.deleted_at IS NULL
    AND crp.station_care_request_id = $1;

-- name: GetSourceCareRequestPartnerByCareRequestID :one
SELECT
    crp.*
FROM
    care_request_partners crp
    JOIN care_request_partner_origins crpo ON crp.care_request_partner_origin_id = crpo.id
WHERE
    crp.deleted_at IS NULL
    AND crpo.slug = 'source'
    AND crp.station_care_request_id = $1;

-- name: GetInsuranceByCareRequestAndOrigin :one
SELECT
    p.*
FROM
    care_request_partners crp
    JOIN care_request_partner_origins crpo ON crp.care_request_partner_origin_id = crpo.id
    JOIN partners p ON crp.partner_id = p.id
WHERE
    crp.deleted_at IS NULL
    AND p.deactivated_at IS NULL
    AND crpo.slug = sqlc.arg(care_request_partner_origin_slug)
    AND crp.station_care_request_id = sqlc.arg(station_care_request_id)
    AND p.insurance_package_id IS NOT NULL
LIMIT
    1;
