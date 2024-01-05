-- name: TestAddMarketGroups :many
INSERT INTO
    market_groups (market_group_id, name)
SELECT
    unnest(sqlc.arg(market_group_ids) :: BIGINT [ ]) AS market_group_id,
    unnest(sqlc.arg(market_group_names) :: TEXT [ ]) AS name RETURNING *;

-- name: TestGetMarketGroupByMarketGroupID :one
SELECT
    *
FROM
    market_groups
WHERE
    market_group_id = sqlc.arg(market_group_id);

-- name: TestDeleteAllMarketGroups :exec
DELETE FROM
    market_groups;
