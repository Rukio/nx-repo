-- name: CreatePatient :one
INSERT INTO
    patients (
        id,
        first_name,
        middle_name,
        last_name,
        date_of_birth,
        sex,
        phone_number,
        athena_medical_record_number,
        medical_power_of_attorney_details,
        payer,
        preferred_pharmacy_details,
        doctor_details,
        referrer,
        address_street,
        address_street_2,
        address_city,
        address_state,
        address_zipcode,
        address_notes,
        address_id
    )
VALUES
    (
        DEFAULT,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19
    ) RETURNING *;

-- name: GetPatient :one
SELECT
    *
FROM
    patients
WHERE
    id = $1;

-- TODO(AC-1310): Replace offset-based pagination
-- name: GetPatients :many
SELECT
    *,
    COUNT(*) OVER()
FROM
    patients
WHERE
    full_name ~* REPLACE(TRIM(sqlc.narg(complete_name)), ' ', '.*')
LIMIT
    sqlc.arg(page_size) :: BIGINT OFFSET sqlc.arg(page_offset) :: BIGINT;

-- name: GetPatientByAthenaID :one
SELECT
    *
FROM
    patients
WHERE
    athena_medical_record_number = sqlc.arg(athena_medical_record_number);

-- name: GetPatientsByID :many
SELECT
    *
FROM
    patients
WHERE
    id = ANY(sqlc.arg(ids) :: BIGINT [ ]);

-- name: UpdatePatient :one
UPDATE
    patients
SET
    first_name = sqlc.arg(first_name),
    middle_name = COALESCE(sqlc.narg(middle_name), middle_name),
    last_name = sqlc.arg(last_name),
    date_of_birth = sqlc.arg(date_of_birth),
    sex = sqlc.arg(sex),
    phone_number = COALESCE(sqlc.narg(phone_number), phone_number),
    athena_medical_record_number = COALESCE(
        sqlc.narg(athena_medical_record_number),
        athena_medical_record_number
    ),
    medical_power_of_attorney_details = COALESCE(
        sqlc.narg(medical_power_of_attorney_details),
        medical_power_of_attorney_details
    ),
    payer = COALESCE(sqlc.narg(payer), payer),
    preferred_pharmacy_details = COALESCE(
        sqlc.narg(preferred_pharmacy_details),
        preferred_pharmacy_details
    ),
    doctor_details = COALESCE(sqlc.narg(doctor_details), doctor_details),
    referrer = COALESCE(sqlc.narg(referrer), referrer),
    address_street = COALESCE(sqlc.narg(address_street), address_street),
    address_street_2 = COALESCE(sqlc.narg(address_street_2), address_street_2),
    address_city = COALESCE(sqlc.narg(address_city), address_city),
    address_state = COALESCE(sqlc.narg(address_state), address_state),
    address_zipcode = COALESCE(sqlc.narg(address_zipcode), address_zipcode),
    address_notes = COALESCE(sqlc.narg(address_notes), address_notes)
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetActivePatients :many
WITH active_phases AS (
    SELECT
        id
    FROM
        care_phases
    WHERE
        name <> 'Closed'
        AND name <> 'Discharged'
        AND name <> 'Closed Without Admitting'
),
active_episodes AS (
    SELECT
        DISTINCT (patient_id)
    FROM
        episodes
        JOIN active_phases ON active_phases.id = episodes.care_phase_id
),
active_patients AS (
    SELECT
        patients.*
    FROM
        patients
        JOIN active_episodes ON patients.id = active_episodes.patient_id
    WHERE
        athena_medical_record_number = ANY(sqlc.arg(athena_ids) :: TEXT [ ])
        OR array_length(sqlc.arg(athena_ids) :: TEXT [ ], 1) IS NULL
)
SELECT
    p.*,
    count
FROM
    (
        SELECT
            active_patients.*
        FROM
            active_patients
        ORDER BY
            active_patients.id
        LIMIT
            sqlc.arg(page_size) :: BIGINT OFFSET sqlc.arg(page_offset) :: BIGINT
    ) AS p
    JOIN (
        SELECT
            COUNT(*)
        FROM
            active_patients
    ) AS count ON TRUE;
