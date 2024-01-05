-- +goose NO TRANSACTION
-- +goose Up
-- +goose StatementBegin
CREATE INDEX CONCURRENTLY insurance_networks_insurance_payer_idx ON insurance_networks(insurance_payer_id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP INDEX insurance_networks_insurance_payer_idx;

-- +goose StatementEnd
