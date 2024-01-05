-- +goose NO TRANSACTION
-- +goose Up
CREATE INDEX CONCURRENTLY insurance_networks_insurance_classification_idx ON insurance_networks(insurance_classification_id);

COMMENT ON INDEX insurance_networks_insurance_classification_idx IS 'Lookup index on insurance network by insurance classification ID';

-- +goose Down
DROP INDEX insurance_networks_insurance_classification_idx;
