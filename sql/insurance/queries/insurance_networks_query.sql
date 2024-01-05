-- name: CreateInsuranceNetwork :one
INSERT INTO
    insurance_networks (
        name,
        notes,
        insurance_plan_id,
        insurance_payer_id,
        insurance_classification_id,
        eligibility_check_enabled,
        package_id,
        provider_enrollment_enabled,
        is_active,
        emc_code
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;

-- name: SearchInsuranceNetworks :many
SELECT
    insurance_networks.*,
    insurance_payers.name AS insurance_payer_name
FROM
    insurance_networks
    LEFT JOIN insurance_network_states ON insurance_networks.id = insurance_network_states.insurance_network_id
    LEFT JOIN insurance_network_addresses ON insurance_networks.id = insurance_network_addresses.insurance_network_id
    JOIN insurance_payers ON insurance_networks.insurance_payer_id = insurance_payers.id
WHERE
    insurance_networks.deleted_at IS NULL
    AND insurance_payers.deleted_at IS NULL
    AND (
        sqlc.arg(show_inactive) :: BOOL IS TRUE
        OR insurance_networks.is_active = TRUE
    )
    AND (
        sqlc.arg(show_inactive) :: BOOL IS TRUE
        OR insurance_payers.is_active = TRUE
    )
    AND (
        sqlc.narg(network_ids) :: BIGINT [ ] IS NULL
        OR insurance_networks.id = ANY(sqlc.narg(network_ids) :: BIGINT [ ])
    )
    AND (
        sqlc.narg(package_ids) :: BIGINT [ ] IS NULL
        OR insurance_networks.package_id = ANY(sqlc.narg(package_ids) :: BIGINT [ ])
    )
    AND (
        sqlc.narg(insurance_plan_ids) :: BIGINT [ ] IS NULL
        OR insurance_networks.insurance_plan_id = ANY(sqlc.narg(insurance_plan_ids) :: BIGINT [ ])
    )
    AND (
        insurance_payers.name ILIKE CONCAT('%', LOWER(sqlc.arg(search_string) :: TEXT), '%')
        OR insurance_networks.name ILIKE CONCAT('%', LOWER(sqlc.arg(search_string) :: TEXT), '%')
        OR insurance_networks.package_id :: TEXT ILIKE CONCAT('%', LOWER(sqlc.arg(search_string) :: TEXT), '%')
        OR insurance_networks.emc_code :: TEXT ILIKE CONCAT('%', LOWER(sqlc.arg(search_string) :: TEXT), '%')
        OR insurance_network_addresses.address ILIKE CONCAT('%', LOWER(sqlc.arg(search_string) :: TEXT), '%')
        OR insurance_network_addresses.zipcode :: TEXT ILIKE CONCAT('%', LOWER(sqlc.arg(search_string) :: TEXT), '%')
        OR insurance_network_addresses.city ILIKE CONCAT('%', LOWER(sqlc.arg(search_string) :: TEXT), '%')
    )
    AND (
        sqlc.narg(filter_states) :: TEXT [ ] IS NULL
        OR insurance_network_states.state_abbr = ANY(sqlc.narg(filter_states) :: TEXT [ ])
    )
    AND (
        sqlc.narg(filter_classifications) :: BIGINT [ ] IS NULL
        OR insurance_networks.insurance_classification_id = ANY(sqlc.narg(filter_classifications) :: BIGINT [ ])
    )
    AND (
        sqlc.narg(payer_ids) :: BIGINT [ ] IS NULL
        OR insurance_networks.insurance_payer_id = ANY(sqlc.narg(payer_ids) :: BIGINT [ ])
    )
GROUP BY
    insurance_networks.id,
    insurance_networks.name,
    insurance_networks.updated_at,
    insurance_payers.name
ORDER BY
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'name'
        AND sqlc.arg(sort_direction) :: TEXT = 'asc' THEN LOWER(insurance_networks.name)
    END ASC,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'name'
        AND sqlc.arg(sort_direction) :: TEXT = 'desc' THEN LOWER(insurance_networks.name)
    END DESC,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'updated_at'
        AND sqlc.arg(sort_direction) :: TEXT = 'asc' THEN insurance_networks.updated_at
    END ASC,
    CASE
        WHEN sqlc.arg(sort_by) :: TEXT = 'updated_at'
        AND sqlc.arg(sort_direction) :: TEXT = 'desc' THEN insurance_networks.updated_at
    END DESC;

-- name: GetInsuranceNetwork :one
SELECT
    *
FROM
    insurance_networks
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: GetInsuranceNetworkByInsurancePlanID :one
SELECT
    insurance_networks.*,
    insurance_payers.payer_group_id AS insurance_payer_group_id,
    insurance_payers.name AS insurance_payer_name
FROM
    insurance_networks
    JOIN insurance_payers ON insurance_networks.insurance_payer_id = insurance_payers.id
WHERE
    insurance_networks.insurance_plan_id = $1
    AND insurance_networks.deleted_at IS NULL;

-- name: UpdateInsuranceNetwork :one
UPDATE
    insurance_networks
SET
    name = sqlc.arg(name),
    notes = sqlc.arg(notes),
    insurance_plan_id = sqlc.arg(insurance_plan_id),
    insurance_payer_id = sqlc.arg(insurance_payer_id),
    insurance_classification_id = sqlc.arg(insurance_classification_id),
    address = sqlc.arg(address),
    billing_state = sqlc.arg(billing_state),
    zipcode = sqlc.arg(zipcode),
    city = sqlc.arg(city),
    eligibility_check_enabled = sqlc.arg(eligibility_check_enabled),
    package_id = sqlc.arg(package_id),
    provider_enrollment_enabled = sqlc.arg(provider_enrollment_enabled),
    is_active = sqlc.arg(is_active),
    emc_code = sqlc.arg(emc_code),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id)
    AND deleted_at IS NULL RETURNING *;

-- name: DeleteInsuranceNetwork :one
UPDATE
    insurance_networks
SET
    deleted_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetInsuranceNetworkStates :many
SELECT
    *
FROM
    insurance_network_states;

-- name: GetInsuranceNetworkStatesByInsuranceNetworkIDs :many
SELECT
    *
FROM
    insurance_network_states
WHERE
    insurance_network_id = ANY (sqlc.arg(networks_ids) :: BIGINT [ ]);

-- name: DeleteInsuranceNetworkStatesByInsuranceNetworkID :exec
DELETE FROM
    insurance_network_states
WHERE
    insurance_network_id = $1;

-- name: CreateInsuranceNetworkStatesByInsuranceNetworkID :copyfrom
INSERT INTO
    insurance_network_states(insurance_network_id, state_abbr)
VALUES
    ($1, $2);

-- name: GetInsuranceNetworkAddressesByInsuranceNetworkID :many
SELECT
    *
FROM
    insurance_network_addresses
WHERE
    insurance_network_id = ANY (sqlc.arg(networks_ids) :: BIGINT [ ])
ORDER BY
    insurance_network_id;

-- name: CreateInsuranceNetworkAddressesByInsuranceNetworkID :copyfrom
INSERT INTO
    insurance_network_addresses(
        insurance_network_id,
        address,
        zipcode,
        city,
        billing_state
    )
VALUES
    ($1, $2, $3, $4, $5);

-- name: DeleteInsuranceNetworkAddressesByInsuranceNetworkID :exec
DELETE FROM
    insurance_network_addresses
WHERE
    insurance_network_id = $1;

-- name: GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID :many
SELECT
    *
FROM
    insurance_networks_appointment_types
WHERE
    network_id = sqlc.arg(network_id)
    AND (
        sqlc.narg(service_line_id) :: BIGINT IS NULL
        OR service_line_id = sqlc.narg(service_line_id)
    );

-- name: CreateInsuranceNetworksAppointmentTypes :many
INSERT INTO
    insurance_networks_appointment_types(
        network_id,
        service_line_id,
        modality_type,
        new_patient_appointment_type,
        existing_patient_appointment_type
    )
SELECT
    unnest(sqlc.arg(network_ids) :: BIGINT [ ]) AS network_id,
    unnest(sqlc.arg(service_line_ids) :: BIGINT [ ]) AS service_line_id,
    unnest(sqlc.arg(modality_types) :: TEXT [ ]) AS modality_type,
    unnest(sqlc.arg(new_patient_appointment_types) :: TEXT [ ]) AS new_patient_appointment_type,
    unnest(
        sqlc.arg(existing_patient_appointment_types) :: TEXT [ ]
    ) AS existing_patient_appointment_type RETURNING *;

-- name: DeleteInsuranceNetworksAppointmentTypesByInsuranceNetworkID :exec
DELETE FROM
    insurance_networks_appointment_types
WHERE
    network_id = $1;
