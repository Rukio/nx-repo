-- name: GetServiceRequest :one
SELECT
    *
FROM
    service_requests
WHERE
    id = $1;

-- TODO(AC-1310): Replace offset-based pagination
-- name: GetServiceRequests :many
WITH filtered_service_requests AS (
    SELECT
        service_requests.*
    FROM
        service_requests
    WHERE
        service_requests.status_id = ANY(sqlc.arg(status_ids) :: BIGINT [ ])
        AND service_requests.market_id = ANY(sqlc.arg(market_ids) :: BIGINT [ ])
)
SELECT
    s.*,
    count
FROM
    (
        SELECT
            filtered_service_requests.*
        FROM
            filtered_service_requests
        LIMIT
            sqlc.arg(page_size) :: BIGINT OFFSET sqlc.arg(page_offset) :: BIGINT
    ) AS s
    JOIN (
        SELECT
            COUNT(*)
        FROM
            filtered_service_requests
    ) AS count ON TRUE;

-- name: GetServiceRequestByCareRequestID :one
SELECT
    *
FROM
    service_requests
WHERE
    care_request_id = $1;
