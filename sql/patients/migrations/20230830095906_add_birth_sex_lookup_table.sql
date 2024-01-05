-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS birth_sex(
    id bigserial PRIMARY KEY,
    short_name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE birth_sex IS 'Categories of birth sex';

COMMENT ON COLUMN birth_sex.short_name IS 'Short name of the birth sex category';

COMMENT ON COLUMN birth_sex.description IS 'Description of the birth sex category';

CREATE UNIQUE INDEX IF NOT EXISTS birth_sex_short_name_idx ON birth_sex(short_name);

COMMENT ON INDEX birth_sex_short_name_idx IS 'Lookup index for birth sex';

INSERT INTO
    birth_sex(id, short_name, description)
VALUES
    (1, 'male', 'Male'),
    (2, 'female', 'Female'),
    (3, 'undisclosed', 'Choose not to disclose'),
    (4, 'unknown', 'Unknown');

ALTER TABLE
    unverified_patients
ADD
    COLUMN birth_sex_id BIGINT,
ADD
    CONSTRAINT fk_unverified_patients_birth_sex FOREIGN KEY (birth_sex_id) REFERENCES birth_sex (id);

UPDATE
    unverified_patients
SET
    birth_sex_id = 1
WHERE
    birth_sex = 'm';

UPDATE
    unverified_patients
SET
    birth_sex_id = 2
WHERE
    birth_sex = 'f';

UPDATE
    unverified_patients
SET
    birth_sex_id = 4
WHERE
    birth_sex = 'u';

COMMENT ON COLUMN unverified_patients.birth_sex_id IS 'Birth sex of the patient';

ALTER TABLE
    unverified_patients DROP COLUMN birth_sex;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    unverified_patients
ADD
    COLUMN birth_sex sex;

UPDATE
    unverified_patients
SET
    birth_sex = 'm'
WHERE
    birth_sex_id = 1;

UPDATE
    unverified_patients
SET
    birth_sex = 'f'
WHERE
    birth_sex_id = 2;

UPDATE
    unverified_patients
SET
    birth_sex = 'u'
WHERE
    birth_sex_id = 3
    OR birth_sex_id = 4;

ALTER TABLE
    unverified_patients DROP COLUMN birth_sex_id;

DROP TABLE IF EXISTS birth_sex;

-- +goose StatementEnd
