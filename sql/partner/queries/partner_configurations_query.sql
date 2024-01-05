-- name: GetPartnerConfigurationByID :one
SELECT
    p.*,
    s.connection_name,
    s.logout_url,
    s.enforce_role_presence,
    r.source_id,
    r.destination_id,
    r.clinical_summary_destination_id,
    r.cancellation_id,
    r.is_clinical_summary_enabled
FROM
    partner_configurations p
    LEFT JOIN sso_configurations s ON p.id = s.partner_configuration_id
    LEFT JOIN redox_configurations r ON p.id = r.partner_configuration_id
WHERE
    r.deleted_at IS NULL
    AND s.deleted_at IS NULL
    AND p.id = $1;

-- name: GetPartnerConfigurationByExpressID :one
SELECT
    *
FROM
    partner_configurations
WHERE
    express_id = $1
    AND deleted_at IS NULL;

-- name: SearchPartnerConfigurationByName :many
SELECT
    p.*
FROM
    partners p
WHERE
    p.display_name ILIKE CONCAT('%', sqlc.arg(display_name) :: TEXT, '%')
    AND p.deleted_at IS NULL
ORDER BY
    p.display_name
LIMIT
    sqlc.arg(max_result_count);

-- name: AddPartnerConfiguration :one
INSERT INTO
    partner_configurations (
        express_id,
        display_name,
        phone_number,
        is_redox_enabled,
        is_risk_strat_bypass_enabled,
        is_sso_enabled,
        is_view_all_care_requests_enabled
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: UpdatePartnerConfiguration :one
UPDATE
    partner_configurations
SET
    display_name = COALESCE(sqlc.narg(display_name), display_name),
    phone_number = COALESCE(sqlc.narg(phone_number), phone_number),
    is_redox_enabled = COALESCE(sqlc.narg(is_redox_enabled), is_redox_enabled),
    is_risk_strat_bypass_enabled = COALESCE(
        sqlc.narg(is_risk_strat_bypass_enabled),
        is_risk_strat_bypass_enabled
    ),
    is_sso_enabled = COALESCE(sqlc.narg(is_sso_enabled), is_sso_enabled),
    is_view_all_care_requests_enabled = COALESCE(
        sqlc.narg(is_view_all_care_requests_enabled),
        is_view_all_care_requests_enabled
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: DeletePartnerConfiguration :one
UPDATE
    partner_configurations
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: AddEmailDomain :one
INSERT INTO
    email_domains (partner_configuration_id, domain_description)
VALUES
    ($1, $2) RETURNING *;

-- name: DeleteEmailDomainsByPartnerConfigurationID :many
UPDATE
    email_domains
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_id = sqlc.arg(partner_configuration_id)
    AND deleted_at IS NULL RETURNING *;

-- name: GetEmailDomainsByPartnerConfigurationID :many
SELECT
    *
FROM
    email_domains
WHERE
    partner_configuration_id = $1
    AND deleted_at IS NULL;

-- name: AddRedoxConfiguration :one
INSERT INTO
    redox_configurations (
        partner_configuration_id,
        cancellation_id,
        clinical_summary_destination_id,
        is_clinical_summary_enabled,
        destination_id,
        source_id
    )
VALUES
    ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: UpdateRedoxConfiguration :one
UPDATE
    redox_configurations
SET
    cancellation_id = sqlc.narg(cancellation_id),
    clinical_summary_destination_id = sqlc.arg(clinical_summary_destination_id),
    is_clinical_summary_enabled = sqlc.arg(is_clinical_summary_enabled),
    destination_id = sqlc.arg(destination_id),
    source_id = sqlc.arg(source_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_id = sqlc.arg(partner_configuration_id) RETURNING *;

-- name: DeleteRedoxConfigurationByPartnerConfigurationID :one
UPDATE
    redox_configurations
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_id = $1
    AND deleted_at IS NULL RETURNING *;

-- name: AddSSOConfiguration :one
INSERT INTO
    sso_configurations (
        partner_configuration_id,
        connection_name,
        logout_url,
        enforce_role_presence
    )
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: UpdateSSOConfiguration :one
UPDATE
    sso_configurations
SET
    connection_name = sqlc.arg(connection_name),
    logout_url = sqlc.arg(logout_url),
    enforce_role_presence = sqlc.arg(enforce_role_presence),
    updated_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_id = sqlc.arg(partner_configuration_id) RETURNING *;

-- name: DeleteSSOConfigurationByPartnerConfigurationID :one
UPDATE
    sso_configurations
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_id = $1
    AND deleted_at IS NULL RETURNING *;

-- name: SearchPartnerConfigurations :many
SELECT
    p.*,
    s.connection_name,
    s.logout_url,
    s.enforce_role_presence,
    r.source_id,
    r.destination_id,
    r.clinical_summary_destination_id,
    r.cancellation_id,
    r.is_clinical_summary_enabled
FROM
    partner_configurations p
    LEFT JOIN sso_configurations s ON p.id = s.partner_configuration_id
    LEFT JOIN redox_configurations r ON p.id = r.partner_configuration_id
WHERE
    r.deleted_at IS NULL
    AND s.deleted_at IS NULL
    AND (
        NOT(sqlc.arg(name_filter_enabled) :: bool)
        OR (
            p.display_name ILIKE CONCAT('%', sqlc.arg(display_name) :: TEXT, '%')
        )
    )
    AND (
        NOT(sqlc.arg(redox_filter_enabled) :: bool)
        OR p.is_redox_enabled
    )
ORDER BY
    p.display_name,
    p.id DESC OFFSET sqlc.arg(page_offset)
LIMIT
    sqlc.arg(page_size);

-- name: CountPartnerConfigurations :one
SELECT
    COUNT(*)
FROM
    partner_configurations p
WHERE
    (
        NOT(sqlc.arg(name_filter_enabled) :: bool)
        OR (
            p.display_name ILIKE CONCAT('%', sqlc.arg(display_name) :: TEXT, '%')
        )
    )
    AND (
        NOT(sqlc.arg(redox_filter_enabled) :: bool)
        OR p.is_redox_enabled
    );

-- name: AddMarket :one
INSERT INTO
    markets (display_name, station_market_id)
VALUES
    ($1, $2) RETURNING *;

-- name: GetMarketByID :one
SELECT
    *
FROM
    markets
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: GetMarketByStationMarketID :one
SELECT
    *
FROM
    markets
WHERE
    station_market_id = $1
    AND deleted_at IS NULL
LIMIT
    1;

-- name: AddServiceLine :one
INSERT INTO
    service_lines (
        short_name,
        display_name,
        genesys_email,
        allow_bypass_risk_stratification
    )
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- name: UpdateServiceLine :one
UPDATE
    service_lines
SET
    display_name = sqlc.arg(display_name),
    genesys_email = sqlc.arg(genesys_email),
    allow_bypass_risk_stratification = sqlc.arg(allow_bypass_risk_stratification),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: AddPartnerConfigurationMarket :one
INSERT INTO
    partner_configuration_markets (partner_configuration_id, market_id)
VALUES
    ($1, $2) RETURNING *;

-- name: GetMarketsAndServiceLinesByIDOrPartnerConfigID :many
SELECT
    pcm.id AS market_id,
    m.station_market_id,
    m.display_name AS market_display_name,
    pcm.partner_configuration_id,
    sl.id AS service_line_id,
    sl.short_name AS service_line_short_name,
    sl.display_name AS service_line_display_name,
    sl.genesys_email,
    sl.allow_bypass_risk_stratification
FROM
    partner_configuration_markets pcm
    JOIN markets m ON pcm.market_id = m.id
    JOIN partner_configuration_market_service_lines pcmsl ON pcm.id = pcmsl.partner_configuration_market_id
    JOIN service_lines sl ON pcmsl.service_line_id = sl.id
WHERE
    pcm.partner_configuration_id = COALESCE(
        sqlc.narg(partner_configuration_id),
        pcm.partner_configuration_id
    )
    AND pcm.id = COALESCE(
        sqlc.narg(partner_configuration_market_id),
        pcm.id
    )
    AND pcm.deleted_at IS NULL
    AND m.deleted_at IS NULL
    AND pcmsl.deleted_at IS NULL
    AND sl.deleted_at IS NULL;

-- name: GetPartnerConfigurationMarketByID :one
SELECT
    *
FROM
    partner_configuration_markets
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID :one
SELECT
    *
FROM
    partner_configuration_markets
WHERE
    partner_configuration_id = $1
    AND market_id = $2
    AND deleted_at IS NULL
LIMIT
    1;

-- name: DeletePartnerConfigurationMarket :one
UPDATE
    partner_configuration_markets
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: DeletePartnerConfigurationMarketsByPartnerConfigID :many
UPDATE
    partner_configuration_markets
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_id = $1
    AND deleted_at IS NULL RETURNING *;

-- name: AddPartnerConfigurationMarketServiceLine :one
INSERT INTO
    partner_configuration_market_service_lines (
        partner_configuration_market_id,
        service_line_id,
        redox_partner_id
    )
VALUES
    ($1, $2, $3) RETURNING *;

-- name: UpdatePartnerConfigurationMarketServiceLine :one
UPDATE
    partner_configuration_market_service_lines
SET
    redox_partner_id = sqlc.arg(redox_partner_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: DeletePartnerConfigurationMarketServiceLine :one
UPDATE
    partner_configuration_market_service_lines
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: DeletePartnerConfigurationMarketServiceLinesByPartnerConfigMarketID :many
UPDATE
    partner_configuration_market_service_lines
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_market_id = $1
    AND deleted_at IS NULL RETURNING *;

-- name: DeletePartnerConfigMarketServiceLinesByPartnerConfigIDs :many
UPDATE
    partner_configuration_market_service_lines
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    partner_configuration_market_id = ANY(
        sqlc.arg(partner_configuration_market_ids) :: BIGINT [ ]
    )
    AND deleted_at IS NULL RETURNING *;

-- name: GetServiceLineByID :one
SELECT
    *
FROM
    service_lines
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: GetServiceLinesByPartnerConfigMarketID :many
SELECT
    sl.*
FROM
    service_lines sl
    JOIN partner_configuration_market_service_lines pcsl ON sl.id = pcsl.service_line_id
    JOIN partner_configuration_markets pc ON pcsl.partner_configuration_market_id = pc.id
WHERE
    pcsl.deleted_at IS NULL
    AND pc.deleted_at IS NULL
    AND sl.deleted_at IS NULL
    AND pc.id = $1;

-- name: GetServiceLinesByExpressIDAndMarketID :many
SELECT
    sl.*
FROM
    service_lines sl
    JOIN partner_configuration_market_service_lines pcsl ON sl.id = pcsl.service_line_id
    JOIN partner_configuration_markets pcm ON pcsl.partner_configuration_market_id = pc.id
    JOIN partner_configurations pc ON pcm.partner_configuration_id = pc.id
    JOIN markets m ON pc.market_id = m.id
WHERE
    sl.deleted_at IS NULL
    AND pcsl.deleted_at IS NULL
    AND pc.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND m.deleted_at IS NULL
    AND m.id = sqlc.arg(market_id)
    AND pc.express_id = sqlc.arg(express_id);

-- name: GetRequestedServiceByMarket :one
SELECT
    sl.*
FROM
    service_lines sl
    JOIN partner_configuration_market_service_lines pcsl ON sl.id = pcsl.service_line_id
    JOIN partner_configuration_markets pc ON pcsl.partner_configuration_market_id = pc.id
    JOIN markets m ON pc.market_id = m.id
WHERE
    pcsl.deleted_at IS NULL
    AND pc.deleted_at IS NULL
    AND sl.short_name = $1
    AND m.display_name = $2;
