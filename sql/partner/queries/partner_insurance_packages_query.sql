-- name: AddPartnerInsurancePackage :one
INSERT INTO
    partner_insurance_packages (package_id, partner_id)
VALUES
    ($1, $2) RETURNING *;

-- name: DeletePartnerInsurancesByPartnerID :many
UPDATE
    partner_insurance_packages
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    partner_id = sqlc.arg(partner_id)
    AND deleted_at IS NULL RETURNING *;

-- name: GetPartnerInsurancePackagesByPartnerID :many
SELECT
    *
FROM
    partner_insurance_packages
WHERE
    partner_id = $1
    AND deleted_at IS NULL;

-- name: GetPartnerInsurancePackagesByPackageID :many
SELECT
    *
FROM
    partner_insurance_packages
WHERE
    package_id = $1
    AND deleted_at IS NULL;
