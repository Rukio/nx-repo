-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    staging_provider_metrics
ALTER COLUMN
    average_net_promoter_score DROP NOT NULL,
ALTER COLUMN
    median_on_scene_time_secs DROP NOT NULL,
ALTER COLUMN
    last_care_request_completed_at DROP NOT NULL;

ALTER TABLE
    historical_provider_metrics
ALTER COLUMN
    average_net_promoter_score DROP NOT NULL,
ALTER COLUMN
    median_on_scene_time_secs DROP NOT NULL,
ALTER COLUMN
    last_care_request_completed_at DROP NOT NULL;

ALTER TABLE
    calculated_provider_metrics
ALTER COLUMN
    average_net_promoter_score DROP NOT NULL,
ALTER COLUMN
    average_net_promoter_score_change DROP NOT NULL,
ALTER COLUMN
    median_on_scene_time_secs DROP NOT NULL,
ALTER COLUMN
    median_on_scene_time_secs_change DROP NOT NULL,
ALTER COLUMN
    last_care_request_completed_at DROP NOT NULL;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
-- intentionally irreversible
-- +goose StatementEnd
