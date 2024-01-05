-- +goose Up
-- +goose StatementBegin
UPDATE
    patients
SET
    phone_number = ''
WHERE
    phone_number IS NULL;

UPDATE
    patients
SET
    address_street = ''
WHERE
    address_street IS NULL;

UPDATE
    patients
SET
    address_city = ''
WHERE
    address_city IS NULL;

UPDATE
    patients
SET
    address_state = ''
WHERE
    address_state IS NULL;

UPDATE
    patients
SET
    address_zipcode = ''
WHERE
    address_zipcode IS NULL;

-- Add new NOT NULL constraints and address_id column
ALTER TABLE
    patients
ALTER COLUMN
    phone_number
SET
    NOT NULL,
ALTER COLUMN
    address_street
SET
    NOT NULL,
ALTER COLUMN
    address_city
SET
    NOT NULL,
ALTER COLUMN
    address_state
SET
    NOT NULL,
ALTER COLUMN
    address_zipcode
SET
    NOT NULL,
ADD
    COLUMN address_id BIGINT;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    patients DROP COLUMN address_id,
ALTER COLUMN
    phone_number DROP NOT NULL,
ALTER COLUMN
    address_street DROP NOT NULL,
ALTER COLUMN
    address_city DROP NOT NULL,
ALTER COLUMN
    address_state DROP NOT NULL,
ALTER COLUMN
    address_zipcode DROP NOT NULL;

UPDATE
    patients
SET
    phone_number = NULL
WHERE
    phone_number = '';

UPDATE
    patients
SET
    address_street = NULL
WHERE
    address_street = '';

UPDATE
    patients
SET
    address_city = NULL
WHERE
    address_city = '';

UPDATE
    patients
SET
    address_state = NULL
WHERE
    address_state = '';

UPDATE
    patients
SET
    address_zipcode = NULL
WHERE
    address_zipcode = '';

-- +goose StatementEnd
