-- name: AddPartnerAssociationBackfill :one
INSERT INTO
    care_request_partner_backfills (partner_id, start_date, end_date, backfill_type_id)
VALUES
    (
        $1,
        $2,
        $3,
        (
            SELECT
                id
            FROM
                care_request_partner_backfill_types
            WHERE
                slug = sqlc.arg(backfill_type)
        )
    ) RETURNING *;

-- name: CompletePartnerAssociationBackfillByID :one
UPDATE
    care_request_partner_backfills
SET
    error_description = sqlc.narg(error_description),
    completed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: UpdatePartnerAssociationBackfillByID :one
UPDATE
    care_request_partner_backfills
SET
    last_processed_care_request_created_at = sqlc.arg(last_processed_care_request_created_at),
    number_of_matches = number_of_matches + sqlc.arg(number_of_new_matches),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING *;

-- name: GetInProgressBackfillByPartnerAndType :one
SELECT
    crpb.*
FROM
    care_request_partner_backfills crpb
    JOIN care_request_partner_backfill_types crpbt ON crpb.backfill_type_id = crpbt.id
WHERE
    crpbt.slug = sqlc.arg(backfill_type)
    AND crpb.completed_at IS NULL
    AND crpb.partner_id = sqlc.arg(partner_id)
LIMIT
    1;

-- name: GetPendingBackfills :many
SELECT
    crpb.*
FROM
    care_request_partner_backfills crpb
    JOIN care_request_partner_backfill_types crpbt ON crpb.backfill_type_id = crpbt.id
WHERE
    crpb.completed_at IS NULL;
