-- name: AddPatient :one
INSERT INTO
    patients (
        patient_id,
        dob,
        legal_sex,
        first_name,
        last_name,
        middle_name,
        suffix,
        alt_first_name,
        home_phone,
        mobile_phone,
        email,
        address_one,
        address_two,
        city,
        state_code,
        zip,
        contact_name,
        contact_relationship,
        contact_mobile_phone,
        guarantor_first_name,
        guarantor_middle_name,
        guarantor_last_name,
        guarantor_suffix,
        guarantor_dob,
        guarantor_phone,
        guarantor_email,
        guarantor_address_one,
        guarantor_address_two,
        guarantor_city,
        guarantor_state_code,
        guarantor_zip,
        guarantor_address_same_as_patient,
        guarantor_relationship_to_patient,
        department_id,
        primary_provider_id,
        portal_access_given,
        gender_identity,
        gender_identity_other,
        birth_sex
    )
VALUES
    (
        sqlc.arg(patient_id),
        sqlc.arg(dob),
        sqlc.arg(legal_sex),
        sqlc.arg(first_name),
        sqlc.arg(last_name),
        sqlc.arg(middle_name),
        sqlc.arg(suffix),
        sqlc.arg(alt_first_name),
        sqlc.arg(home_phone),
        sqlc.arg(mobile_phone),
        sqlc.arg(email),
        sqlc.arg(address_one),
        sqlc.arg(address_two),
        sqlc.arg(city),
        sqlc.arg(state_code),
        sqlc.arg(zip),
        sqlc.arg(contact_name),
        sqlc.arg(contact_relationship),
        sqlc.arg(contact_mobile_phone),
        sqlc.arg(guarantor_first_name),
        sqlc.arg(guarantor_middle_name),
        sqlc.arg(guarantor_last_name),
        sqlc.arg(guarantor_suffix),
        sqlc.arg(guarantor_dob),
        sqlc.arg(guarantor_phone),
        sqlc.arg(guarantor_email),
        sqlc.arg(guarantor_address_one),
        sqlc.arg(guarantor_address_two),
        sqlc.arg(guarantor_city),
        sqlc.arg(guarantor_state_code),
        sqlc.arg(guarantor_zip),
        sqlc.arg(guarantor_address_same_as_patient),
        sqlc.arg(guarantor_relationship_to_patient),
        sqlc.arg(department_id),
        sqlc.arg(primary_provider_id),
        sqlc.arg(portal_access_given),
        sqlc.arg(gender_identity),
        sqlc.arg(gender_identity_other),
        sqlc.arg(birth_sex)
    ) RETURNING *;

-- name: UpdatePatient :one
UPDATE
    patients
SET
    patient_id = sqlc.arg(patient_id),
    dob = sqlc.arg(dob),
    legal_sex = sqlc.arg(legal_sex),
    first_name = sqlc.arg(first_name),
    last_name = sqlc.arg(last_name),
    middle_name = sqlc.arg(middle_name),
    suffix = sqlc.arg(suffix),
    alt_first_name = sqlc.arg(alt_first_name),
    home_phone = sqlc.arg(home_phone),
    mobile_phone = sqlc.arg(mobile_phone),
    email = sqlc.arg(email),
    address_one = sqlc.arg(address_one),
    address_two = sqlc.arg(address_two),
    city = sqlc.arg(city),
    state_code = sqlc.arg(state_code),
    zip = sqlc.arg(zip),
    contact_name = sqlc.arg(contact_name),
    contact_relationship = sqlc.arg(contact_relationship),
    contact_mobile_phone = sqlc.arg(contact_mobile_phone),
    guarantor_first_name = sqlc.arg(guarantor_first_name),
    guarantor_middle_name = sqlc.arg(guarantor_middle_name),
    guarantor_last_name = sqlc.arg(guarantor_last_name),
    guarantor_suffix = sqlc.arg(guarantor_suffix),
    guarantor_dob = sqlc.arg(guarantor_dob),
    guarantor_phone = sqlc.arg(guarantor_phone),
    guarantor_email = sqlc.arg(guarantor_email),
    guarantor_address_one = sqlc.arg(guarantor_address_one),
    guarantor_address_two = sqlc.arg(guarantor_address_two),
    guarantor_city = sqlc.arg(guarantor_city),
    guarantor_state_code = sqlc.arg(guarantor_state_code),
    guarantor_zip = sqlc.arg(guarantor_zip),
    guarantor_address_same_as_patient = sqlc.arg(guarantor_address_same_as_patient),
    guarantor_relationship_to_patient = sqlc.arg(guarantor_relationship_to_patient),
    department_id = sqlc.arg(department_id),
    primary_provider_id = sqlc.arg(primary_provider_id),
    portal_access_given = sqlc.arg(portal_access_given),
    gender_identity = sqlc.arg(gender_identity),
    gender_identity_other = sqlc.arg(gender_identity_other),
    birth_sex = sqlc.arg(birth_sex),
    updated_at = CURRENT_TIMESTAMP
WHERE
    patient_id = sqlc.arg(patient_id)
    AND deleted_at IS NULL RETURNING *;

-- name: GetPatient :one
SELECT
    *
FROM
    patients
WHERE
    patient_id = $1
    AND deleted_at IS NULL;

-- name: DeletePatient :one
UPDATE
    patients
SET
    deleted_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE
    patient_id = $1 RETURNING *;

-- name: GetPatientsByID :many
SELECT
    *
FROM
    patients
WHERE
    patient_id = ANY($1 :: TEXT [ ])
    AND deleted_at IS NULL;

-- name: SearchPatientsByName :many
SELECT
    *
FROM
    patients
WHERE
    (
        -- Full name is similar to input characters
        (first_name || ' ' || last_name) % sqlc.arg(search_term) :: TEXT
        OR (alt_first_name || ' ' || last_name) % sqlc.arg(search_term) :: TEXT -- Full name begins with sounds of input characters, to a max resolution of 15 metaphone characters
        OR METAPHONE(first_name || ' ' || last_name, 15) LIKE METAPHONE(sqlc.arg(search_term) :: TEXT, 15) || '%'
        OR METAPHONE(alt_first_name || ' ' || last_name, 15) LIKE METAPHONE(sqlc.arg(search_term) :: TEXT, 15) || '%' -- Use DMETAPHONE_ALT for non-english pronunciations
        -- First name sounds like first word, or last name sounds like all words after first word
        -- This is not accurate for first names with multiple words, but is good enough when combined with similarity search above
        -- We split into input[0] and input[1:] instead of using input.join() because DMETAPHONE_ALT has a max length of 4
        -- Do not use LIKE 'input%' because too many false positives with only 4 metaphone chars
        OR DMETAPHONE_ALT(first_name) = DMETAPHONE_ALT(SPLIT_PART(sqlc.arg(search_term) :: TEXT, ' ', 1))
        OR DMETAPHONE_ALT(alt_first_name) = DMETAPHONE_ALT(SPLIT_PART(sqlc.arg(search_term) :: TEXT, ' ', 1))
        OR DMETAPHONE_ALT(last_name) = DMETAPHONE_ALT(
            ARRAY_TO_STRING(
                (
                    STRING_TO_ARRAY(sqlc.arg(search_term) :: TEXT, ' ', 1)
                ) [ 2: ],
                ' '
            )
        )
    )
    AND deleted_at IS NULL
ORDER BY
    sqlc.arg(search_term) <<-> (first_name || ' ' || last_name) ASC
LIMIT
    50;
