-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    external_care_providers
ALTER COLUMN
    provider_type_id TYPE BIGINT USING provider_type_id :: BIGINT;

ALTER TABLE
    external_care_providers
ADD
    CONSTRAINT external_care_providers_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES provider_types(id) NOT VALID;

ALTER TABLE
    external_care_providers VALIDATE CONSTRAINT external_care_providers_provider_type_id_fkey;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    external_care_providers DROP CONSTRAINT external_care_providers_provider_type_id_fkey,
ALTER COLUMN
    provider_type_id TYPE TEXT;

-- +goose StatementEnd
