-- +goose Up
-- +goose StatementBegin
ALTER TABLE
    optimizer_service_region_settings
ADD
    CONSTRAINT optimizer_service_region_settings_unique_region_created_at UNIQUE(service_region_id, created_at);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    optimizer_service_region_settings DROP CONSTRAINT optimizer_service_region_settings_unique_region_created_at;

-- +goose StatementEnd
