-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY network_modality_configurations_billing_city_id_idx ON network_modality_configurations(billing_city_id);

COMMENT ON INDEX network_modality_configurations_billing_city_id_idx IS 'Lookup index for network_modality_configurations by billing_city_id';

-- +goose Down
DROP INDEX network_modality_configurations_billing_city_id_idx;
