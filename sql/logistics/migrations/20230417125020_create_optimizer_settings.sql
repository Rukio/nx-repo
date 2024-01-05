-- +goose NO TRANSACTION
-- +goose Up
CREATE TABLE optimizer_settings(
    id bigserial PRIMARY KEY,
    settings jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE optimizer_settings IS 'Settings used to run the optimizer';

COMMENT ON COLUMN optimizer_settings.settings IS 'JSON representation of optimizersettings.Settings used for the optimizer run';

CREATE UNIQUE INDEX CONCURRENTLY optimizer_settings_unique_settings_idx ON optimizer_settings(settings);

ALTER TABLE
    optimizer_settings
ADD
    CONSTRAINT optimizer_settings_unique_settings UNIQUE USING INDEX optimizer_settings_unique_settings_idx;

ALTER TABLE
    optimizer_runs
ADD
    COLUMN optimizer_settings_id BIGINT;

COMMENT ON COLUMN optimizer_runs.optimizer_settings_id IS 'Settings used to run the optimizer';

-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    optimizer_runs DROP COLUMN optimizer_settings_id;

DROP TABLE optimizer_settings;

-- +goose StatementEnd
