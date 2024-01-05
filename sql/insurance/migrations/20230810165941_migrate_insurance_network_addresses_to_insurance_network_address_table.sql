-- +goose Up
-- +goose StatementBegin
INSERT INTO
    insurance_network_address (
        insurance_network_id,
        address,
        zipcode,
        city,
        billing_state
    )
SELECT
    id,
    address,
    zipcode,
    city,
    billing_state
FROM
    insurance_networks
WHERE
    address IS NOT NULL
    AND zipcode IS NOT NULL
    AND city IS NOT NULL
    AND billing_state IS NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    insurance_network_address;

-- +goose StatementEnd
