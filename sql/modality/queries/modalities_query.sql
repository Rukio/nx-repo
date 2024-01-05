-- name: GetModalities :many
SELECT
    *
FROM
    modalities
ORDER BY
    "display_order";

-- name: CalculateModalities :many
SELECT
    modalities.*
FROM
    modalities
    LEFT JOIN modality_configurations mc ON modalities.id = mc.modality_id
    LEFT JOIN market_modality_configurations mmc ON modalities.id = mmc.modality_id
WHERE
    mc.service_line_id = $1
    AND mc.market_id = $2
    AND mc.insurance_plan_id = $3
    AND mmc.service_line_id = $1
    AND mmc.market_id = $2;

-- name: DeleteModalityConfigurationsByServiceLineId :exec
DELETE FROM
    modality_configurations
WHERE
    service_line_id = $1;

-- name: DeleteMarketModalityConfigurationsByServiceLineId :exec
DELETE FROM
    market_modality_configurations
WHERE
    service_line_id = $1;

-- name: DeleteModalityConfigurations :exec
DELETE FROM
    modality_configurations;

-- name: CreateModalityConfigurations :copyfrom
INSERT INTO
    modality_configurations (
        market_id,
        insurance_plan_id,
        modality_id,
        service_line_id
    )
VALUES
    ($1, $2, $3, $4);

-- name: CreateMarketModalityConfigurations :copyfrom
INSERT INTO
    market_modality_configurations (market_id, modality_id, service_line_id)
VALUES
    ($1, $2, $3);

-- name: GetModalityConfigsByServiceLineID :many
SELECT
    *
FROM
    modality_configurations
WHERE
    service_line_id = $1;

-- name: GetEligibleMarketsByModalityType :many
SELECT
    DISTINCT mc.market_id
FROM
    modality_configurations mc
    INNER JOIN market_modality_configurations mmc ON mc.market_id = mmc.market_id
    INNER JOIN modalities m ON mc.modality_id = m.id
WHERE
    m.modality_type = $1;

-- name: InsertCalculateModalitiesLog :exec
INSERT INTO
    calculate_modalities_logs (
        market_id,
        insurance_plan_id,
        service_line_id,
        business_modalities
    )
VALUES
    ($1, $2, $3, $4);

-- name: GetMarketModalityConfigsByServiceLineID :many
SELECT
    *
FROM
    market_modality_configurations
WHERE
    service_line_id = $1;

-- name: DeleteNetworkModalityConfigurationsByNetworkID :exec
DELETE FROM
    network_modality_configurations
WHERE
    network_id = $1;

-- name: CreateNetworkModalityConfigurations :copyfrom
INSERT INTO
    network_modality_configurations (
        network_id,
        billing_city_id,
        service_line_id,
        modality_id
    )
VALUES
    ($1, $2, $3, $4);

-- name: GetNetworkModalityConfigurationsByNetworkID :many
SELECT
    *
FROM
    network_modality_configurations
WHERE
    network_id = $1;

-- name: GetNetworkServiceLinesByNetworkID :many
SELECT
    DISTINCT ON (service_line_id) service_line_id
FROM
    network_modality_configurations
WHERE
    network_id = $1;

-- name: GetCareRequestEligibleModalities :many
SELECT
    modalities.*
FROM
    modalities
    INNER JOIN market_modality_configurations market_configs ON modalities.id = market_configs.modality_id
    INNER JOIN network_modality_configurations network_configs ON modalities.id = network_configs.modality_id
WHERE
    market_configs.market_id = sqlc.arg(market_id)
    AND market_configs.service_line_id = sqlc.arg(service_line_id)
    AND network_configs.service_line_id = sqlc.arg(service_line_id)
    AND network_configs.network_id = sqlc.arg(network_id)
    AND network_configs.billing_city_id = sqlc.arg(billing_city_id);

-- name: GetNetworkModalityConfigurations :many
SELECT
    *
FROM
    network_modality_configurations
WHERE
    (
        sqlc.narg(network_id) :: BIGINT IS NULL
        OR network_id = sqlc.narg(network_id)
    )
    AND (
        sqlc.narg(service_line_id) :: BIGINT IS NULL
        OR service_line_id = sqlc.narg(service_line_id)
    );

-- name: FindEligibleNetworks :many
SELECT
    DISTINCT ON (network_id) network_id
FROM
    network_modality_configurations
WHERE
    (
        sqlc.narg(billing_city_id) :: BIGINT IS NULL
        OR billing_city_id = sqlc.narg(billing_city_id)
    )
    AND (
        sqlc.narg(service_line_id) :: BIGINT IS NULL
        OR service_line_id = sqlc.narg(service_line_id)
    );
