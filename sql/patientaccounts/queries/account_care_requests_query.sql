-- name: GetAccountIdByCareRequestId :one
SELECT
    account_id
FROM
    account_care_requests
WHERE
    care_request_id = $1;

-- name: GetCareRequestIdsByAccountId :many
SELECT
    care_request_id
FROM
    account_care_requests
WHERE
    account_id = $1;

-- name: AddAccountCareRequest :one
INSERT INTO
    account_care_requests (account_id, care_request_id)
VALUES
    ($1, $2) RETURNING *;
