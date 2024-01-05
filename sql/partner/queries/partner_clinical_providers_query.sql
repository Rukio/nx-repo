-- name: AddPartnerClinicalProvider :one
INSERT INTO
    partner_clinical_providers (partner_id, athena_clinical_provider_id)
VALUES
    ($1, $2) RETURNING *;

-- name: GetPartnerClinicalProvidersByPartnerID :many
SELECT
    *
FROM
    partner_clinical_providers
WHERE
    partner_id = $1
ORDER BY
    partner_id,
    athena_clinical_provider_id;

-- name: DeletePartnerClinicalProvidersByPartnerID :many
UPDATE
    partner_clinical_providers
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    partner_id = sqlc.arg(partner_id) RETURNING *;
