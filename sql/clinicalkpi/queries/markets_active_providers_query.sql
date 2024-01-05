-- name: AddActiveProviderForMarkets :exec
INSERT INTO
    markets_active_providers (provider_id, market_id)
SELECT
    sqlc.arg(provider_id) AS provider_id,
    unnest(sqlc.arg(market_ids) :: BIGINT [ ]) AS market_id ON CONFLICT DO NOTHING;

-- name: GetActiveMarketsForProvider :many
SELECT
    market_id
FROM
    markets_active_providers
WHERE
    provider_id = sqlc.arg(provider_id);

-- name: GetActiveProvidersForMarket :many
SELECT
    provider_id
FROM
    markets_active_providers
WHERE
    market_id = sqlc.arg(market_id);

-- name: DeleteActiveMarketsForProvider :exec
DELETE FROM
    markets_active_providers
WHERE
    markets_active_providers.provider_id = sqlc.arg(provider_id)
    AND market_id IN (
        SELECT
            markets_active_providers.market_id
        FROM
            markets_active_providers
            INNER JOIN (
                SELECT
                    unnest(sqlc.arg(market_ids) :: BIGINT [ ]) AS id
            ) markets ON markets_active_providers.market_id = markets.id
    );
