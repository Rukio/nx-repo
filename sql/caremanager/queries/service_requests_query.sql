-- name: CreateServiceRequest :one
INSERT INTO
    service_requests (
        care_request_id,
        market_id,
        status_id,
        category_id,
        is_insurance_verified,
        assigned_to_user_id,
        cms_number
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: UpdateServiceRequest :one
UPDATE
    service_requests
SET
    status_id = COALESCE(sqlc.narg(status_id), status_id),
    is_insurance_verified = COALESCE(
        sqlc.narg(is_insurance_verified),
        is_insurance_verified
    ),
    cms_number = COALESCE(sqlc.narg(cms_number), cms_number),
    assigned_to_user_id = COALESCE(
        sqlc.narg(assigned_to_user_id),
        assigned_to_user_id
    ),
    reject_reason = COALESCE(sqlc.narg(reject_reason), reject_reason),
    rejected_at = COALESCE(sqlc.narg(rejected_at), rejected_at),
    last_updated_by_user_id = sqlc.arg(last_updated_by_user_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;
