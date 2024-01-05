-- +goose Up
-- +goose StatementBegin
CREATE TABLE clinical_urgency_level_configs (
    id BIGSERIAL PRIMARY KEY,
    clinical_urgency_level_id BIGINT NOT NULL,
    optimizer_urgency_level BIGINT NOT NULL,
    clinical_window_duration_sec BIGINT,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clinical_urgency_level_configs IS 'Clinical urgency window information based on urgency level';

COMMENT ON COLUMN clinical_urgency_level_configs.clinical_window_duration_sec IS 'Clinical urgency time window in seconds';

COMMENT ON COLUMN clinical_urgency_level_configs.clinical_urgency_level_id IS 'Clinical urgency level';

COMMENT ON COLUMN clinical_urgency_level_configs.optimizer_urgency_level IS 'Urgency level to be sent to optimizer';

COMMENT ON COLUMN clinical_urgency_level_configs.description IS 'Clinical urgency level short name and time window duration';

CREATE INDEX clinical_urgency_level_configs_clinical_urgency_level_idx ON clinical_urgency_level_configs(clinical_urgency_level_id, created_at DESC);

COMMENT ON INDEX clinical_urgency_level_configs_clinical_urgency_level_idx IS 'Clinical urgency level ID, sorted by created_at';

INSERT INTO
    clinical_urgency_level_configs(
        clinical_urgency_level_id,
        optimizer_urgency_level,
        clinical_window_duration_sec,
        description
    )
VALUES
    (1, 1, 7200, 'high_manual_override: 2 hours'),
    (2, 2, 7200, 'high: 2 hours'),
    (3, 3, 14400, 'normal: 4 hours'),
    (4, 4, NULL, 'low: no window offset');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE clinical_urgency_level_configs;

-- +goose StatementEnd
