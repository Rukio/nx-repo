-- +goose NO TRANSACTION
-- +goose Up
CREATE TABLE optimizer_constraint_configs (
    id bigserial PRIMARY KEY,
    config jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE optimizer_constraint_configs IS 'Constraint configs used to run the optimizer';

COMMENT ON COLUMN optimizer_constraint_configs.config IS 'JSON representation of VRPConstraintConfig used for the optimizer';

CREATE UNIQUE INDEX CONCURRENTLY optimizer_constraint_configs_unique_configs_idx ON optimizer_constraint_configs(config);

ALTER TABLE
    optimizer_constraint_configs
ADD
    CONSTRAINT optimizer_constraint_configs_unique_configs UNIQUE USING INDEX optimizer_constraint_configs_unique_configs_idx;

ALTER TABLE
    optimizer_runs
ADD
    COLUMN optimizer_constraint_config_id BIGINT;

COMMENT ON COLUMN optimizer_runs.optimizer_constraint_config_id IS 'Constraint config used to run the optimizer';

-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    optimizer_runs DROP COLUMN optimizer_constraint_config_id;

DROP TABLE optimizer_constraint_configs;

-- +goose StatementEnd
