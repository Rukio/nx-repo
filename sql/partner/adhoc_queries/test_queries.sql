-- name: DeletePartnerByID :exec
DELETE FROM
    partners
WHERE
    id = $1;

-- name: DeleteCareRequestPartnerBackfillByID :exec
DELETE FROM
    care_request_partner_backfills
WHERE
    id = $1;

-- name: DeletePartnerConfigurationByID :exec
DELETE FROM
    partner_configurations
WHERE
    id = $1;

-- name: DeleteServiceLineByID :exec
DELETE FROM
    service_lines
WHERE
    id = $1;

-- name: UpdatePartnerInsuranceByID :exec
UPDATE
    partners
SET
    insurance_package_id = $2
WHERE
    id = $1;
