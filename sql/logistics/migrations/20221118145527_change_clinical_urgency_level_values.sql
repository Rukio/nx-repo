-- +goose Up
-- +goose StatementBegin
INSERT INTO
    clinical_urgency_level_configs(
        clinical_urgency_level_id,
        optimizer_urgency_level,
        clinical_window_duration_sec,
        description
    )
VALUES
    (1, 4, 7200, 'high_manual_override: 2 hours'),
    (2, 3, 7200, 'high: 2 hours'),
    (3, 2, 14400, 'normal: 4 hours'),
    (4, 1, NULL, 'low: no window offset');

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
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
