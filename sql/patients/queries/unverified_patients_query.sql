-- name: AddUnverifiedPatient :one
INSERT INTO
    unverified_patients (
        athena_id,
        date_of_birth,
        given_name,
        family_name,
        phone_number,
        legal_sex,
        birth_sex_id,
        gender_identity,
        gender_identity_details
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;

-- name: UpdateUnverifiedPatient :one
UPDATE
    unverified_patients
SET
    athena_id = sqlc.arg(athena_id),
    date_of_birth = sqlc.arg(date_of_birth),
    given_name = sqlc.arg(given_name),
    family_name = sqlc.arg(family_name),
    phone_number = sqlc.arg(phone_number),
    legal_sex = sqlc.arg(legal_sex),
    birth_sex_id = sqlc.arg(birth_sex_id),
    gender_identity = sqlc.arg(gender_identity),
    gender_identity_details = sqlc.arg(gender_identity_details),
    patient_id = sqlc.arg(patient_id),
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = sqlc.arg(id) RETURNING *;

-- name: GetUnverifiedPatient :one
SELECT
    *
FROM
    unverified_patients
WHERE
    id = $1;

-- name: ListUnverifiedPatientsByIds :many
SELECT
    *
FROM
    unverified_patients
WHERE
    id = ANY($1 :: BIGINT [ ]);
